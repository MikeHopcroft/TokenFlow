import { DownstreamTermPredicate, Matcher } from '../matchers';
import { PID, Tokenizer, TokenFactory } from '../tokenizer';

export interface Alias {
    pid: PID;
    text: string;
    matcher: Matcher;
}

export interface DomainAlias extends Alias {
    matcher: Matcher;
    isDownstreamTerm: DownstreamTermPredicate<number>;
    factory: TokenFactory;
}

export class Domain {
    descriptors: Alias[];
    ownTerms: Set<number>;

    private downstreamTerms: Set<number>;
    private factory: TokenFactory;

    constructor(aliases: Alias[], factory: TokenFactory, tokenizer: Tokenizer) {
        this.ownTerms = new Set<number>();
        this.downstreamTerms = new Set<number>();
        this.factory = factory;
        this.descriptors = aliases;

        for (const alias of aliases) {
            this.ownTerms.add(tokenizer.stemAndHash(alias.text));
        }
    }

    addDownstreamTerms(domains: Domain[]): void {
        const downstream = new Set<number>();
        for (const domain of domains) {
            if (domain !== this) {
                for (const hash of domain.ownTerms) {
                    downstream.add(hash);
                }
            }
        }
    }

    *aliases(): IterableIterator<DomainAlias> {
        for (const descriptor of this.descriptors) {
            yield {
                ...descriptor,
                isDownstreamTerm: this.isDownstreamTerm,
                factory: this.factory
            };
        }
    }

    private isDownstreamTerm(hash: number): boolean {
        return this.downstreamTerms.has(hash);
    }
}
