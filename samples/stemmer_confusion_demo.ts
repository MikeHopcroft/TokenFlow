import * as Debug from 'debug';
import * as path from 'path';
import { stemmerConfusionMatrix } from '../src/stemmer_confusion_matrix';
import { Unified } from './unified';

function stemmerConfusionDemo() {
    Debug.enable('tf-interactive,tf:*');

    console.log('Stemmer Confusion Matrix');
    console.log();

    const unified = new Unified(
        path.join(__dirname, './data/cars/catalog.yaml'),
        path.join(__dirname, './data/intents.yaml'),
        path.join(__dirname, './data/attributes.yaml'),
        path.join(__dirname, './data/quantifiers.yaml'),
        path.join(__dirname, './data/stopwords.txt'),
        true);

    const matrix = stemmerConfusionMatrix(unified.lexicon);

    let entryCount = 0;
    let collisionCount = 0;
    for (const [key, value] of Object.entries(matrix)) {
        ++entryCount;
        if (value.size > 1) {
            ++collisionCount;
            const values = [...value].join(',');
            console.log(`"${key}": [${values}]`);
        }
    }

    console.log();
    console.log(`${entryCount} unique stemmed terms`);
    console.log(`${collisionCount} collisions`);
}

stemmerConfusionDemo();
