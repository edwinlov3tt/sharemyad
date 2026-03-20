import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

try {
  console.log('Listing objects in sharemyad bucket...');
  const list = await client.send(new ListObjectsV2Command({
    Bucket: 'sharemyad',
    Prefix: 'temp-uploads/',
    MaxKeys: 10,
  }));
  
  console.log('Objects found:', list.KeyCount);
  if (list.Contents) {
    list.Contents.forEach(obj => {
      console.log(`  - ${obj.Key} (${obj.Size} bytes, ETag: ${obj.ETag})`);
    });
  }
} catch (err) {
  console.error('Error:', err.message);
}
