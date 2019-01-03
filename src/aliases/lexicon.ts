import { Domain, DomainAlias } from './domain';

class Lexicon {
    domains: Domain[];

    constructor(domains: Domain[]) {
        this.domains = domains;

        // Set downstream terms.
        for (const domain of domains) {
            domain.addDownstreamTerms(domains);
        }
    }

    *aliases(): IterableIterator<DomainAlias> {
        for (const domain of this.domains) {
            yield* domain.aliases();
        }
    }
}