const AWS = require('aws-sdk');
const readline = require('readline');
const stream = require('stream');

const Transform = stream.Transform;
const s3 = new AWS.S3();

const INPUT_FILE = 'Iris.csv';
const OUTPUT_FILE = 'output.csv';
const BUCKET_NAME = 'rmagee-glue-athena-test';

let readParams = {
    Bucket: BUCKET_NAME,
    Key: INPUT_FILE
}

function writeToBucket() {
    const writeStream = new stream.PassThrough();

    let writeParams = {
        Bucket: BUCKET_NAME,
        Key: OUTPUT_FILE,
        Body: writeStream
    }

    const uploadPromise = s3.upload(writeParams).promise();

    return { writeStream, uploadPromise }
}

let readStream = s3.getObject(readParams).createReadStream();

const { writeStream, uploadPromise } = writeToBucket();

const readInterface = readline.createInterface({
    input: readStream,
    output: process.stdout
});

const bufferMutator = new Transform({
    transform(chunk, encoding, callback) {
        callback();
    }
});

readStream.pipe(readInterface);

readStream.on('close', async () => {
    console.log('Download complete');
    writeStream.end();
    await uploadPromise.then(data => {
        console.log(data);
        console.log('Upload Complete');
    });
});
