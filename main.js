const AWS = require('aws-sdk');
const readline = require('readline');
const stream = require('stream');

const Transform = stream.Transform;
const s3 = new AWS.S3();

const INPUT_FILE = 'NAME_OF_INPUT_FILE';
const OUTPUT_FILE = 'NAME_OF_OUTPUT_FILE';
const BUCKET_NAME = 'NAME_OF_BUCKET';

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

const bufferMutator = new Transform({
    transform(chunk, encoding, callback) {
        let chunkAsString = chunk.toString();
        // Change data here
        this.push(`${chunkAsString}\n`);
        callback();
    }
});

let readStream = s3.getObject(readParams).createReadStream();

const { writeStream, uploadPromise } = writeToBucket();

const readInterface = readline.createInterface({
    input: readStream
});

readInterface.on('line', (line) => {
    bufferMutator.write(line);
});

bufferMutator.on('data', (data) => {
    writeStream.write(data);
});

readStream.on('close', async () => {
    console.log('Download complete');
    writeStream.end();
    await uploadPromise.then(data => {
        console.log(data);
        console.log('Upload Complete');
    })
})
