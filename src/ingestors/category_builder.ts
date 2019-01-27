import { generateAliases, Item, PID } from '..';
import { Logger } from '../utilities';

export type PIDAllocator = () => PID;

// TODO: ISSUE: should this stem terms before searching for dupes?
// TODO: ISSUE: is stemmer idempotent?
// TODO: Should this take a Map or an iterable?

//
// categoryBuilder processes a Map<PID, ITEM> to generate a new
// Map<PID, Item> with synthetic category items associated with
// aliases that previously mapped to multiple PIDs.
//
export function categoryBuilder<ITEM extends Item>(
    items: Map<PID, ITEM>,
    pidAllocator: PIDAllocator
) {
    const logger = new Logger('tf:categoryBuilder');
    //
    // First, find aliases shared by multiples PIDs.
    //
    const aliases = new Map<string, [PID]>();
    for (const [pid, item] of items) {
        for (const rawAliasPattern of item.aliases) {
            const aliasPattern = rawAliasPattern.toLowerCase();
            for (const rawAlias of generateAliases(aliasPattern)) {
// TODO: need to store unstemmed aliases as well, in case stemmer isn't idempotent.
// If the stemmer isn't idempotent, then applying it a second time could change
// alias. 
//                const alias = rawAlias.split(/\s+/).map(stemmer).join(' ');
                const alias = rawAlias;
                const pids = aliases.get(alias);
                if (pids !== undefined) {
                    // PIDs list for an alias should not contain
                    // duplicate PID values.
                    if (!pids.find(x => x === item.pid)) {
                        pids.push(item.pid);
                    }
                }
                else {
                    aliases.set(alias, [item.pid]);
                }
            }
        }
    }

    //
    // Create a version new of the `items` Map with synthetic category items
    // for each alias shared across multiple PIDs. Also returns a mapping from
    // category PID to the list of associated Item PIDs.
    //
    const items2 = new Map<PID, Item>();
    const categories = new Map<PID, [PID]>();
    for (const [alias, pids] of aliases) {
        if (pids.length === 1) {
            // This alias resolves to a single item.
            const pid = pids[0];
            const item = items2.get(pid);
            if (item !== undefined) {
                item.aliases.push(alias);
            }
            else {
                const name = (items.get(pid) as ITEM).name;
                items2.set(pid, { pid, name, aliases: [alias] });
            }
        }
        else {
            // This alias resolves to multiple items.
            const sortedPIDs = pids.sort((n1,n2) => n1 - n2);
            const categoryPID = pidAllocator();
            const name = `MULTIPLE_${sortedPIDs.join("_")}`;
            logger.log(`New category ${name},${categoryPID}: "${alias}": ${sortedPIDs}`);
            items2.set(
                categoryPID,
                {pid: categoryPID, name, aliases: [alias]});
            categories.set(categoryPID, sortedPIDs);
        }
    }

    // TODO: items.length + categories.length should equal items2.length
    return {items: items2, categories};
}