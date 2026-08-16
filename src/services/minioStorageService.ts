import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

export interface UploadResult {
  bucket: string;
  objectKey: string;
  pdfUrl: string;
  size: number;
  mimeType: string;
  fileHash: string;
  storageProvider: string;
}

export class MinioStorageService {
  private static client: S3Client | null = null;

  private static getBucketName(): string {
    return process.env.MINIO_BUCKET || process.env.S3_BUCKET || 'tatovacesta-studies';
  }

  private static getS3Client(): S3Client {
    if (!this.client) {
      const endpoint = process.env.MINIO_ENDPOINT || process.env.S3_ENDPOINT || 'http://127.0.0.1:9000';
      const accessKeyId = process.env.MINIO_ACCESS_KEY || process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || 'minioadmin';
      const secretAccessKey = process.env.MINIO_SECRET_KEY || process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin';
      const region = process.env.MINIO_REGION || process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';

      this.client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true, // Required for MinIO
      });
    }
    return this.client;
  }

  static async uploadPdf(buffer: Buffer, originalFileName: string): Promise<UploadResult> {
    const s3 = this.getS3Client();
    const bucket = this.getBucketName();

    const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const objectKey = `studies/${Date.now()}_${sanitizedName}`;

    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: buffer,
          ContentType: 'application/pdf',
          Metadata: {
            originalFileName,
            fileHash,
          },
        })
      );

      const pdfUrl = `/api/studies/pdf-file/${encodeURIComponent(objectKey)}`;

      return {
        bucket,
        objectKey,
        pdfUrl,
        size: buffer.length,
        mimeType: 'application/pdf',
        fileHash,
        storageProvider: 'MinIO',
      };
    } catch (err: any) {
      console.error(`[MinIO Storage Error] Upload failed for key ${objectKey}:`, err);
      throw new Error(`MinIO Storage upload failed: ${err.message || 'Unknown S3 error'}`);
    }
  }

  static async getObjectStream(bucketName: string | undefined, objectKey: string) {
    const s3 = this.getS3Client();
    const bucket = bucketName || this.getBucketName();

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      });

      const response = await s3.send(command);
      return {
        stream: response.Body,
        contentType: response.ContentType || 'application/pdf',
        contentLength: response.ContentLength || 0,
      };
    } catch (err: any) {
      console.error(`[MinIO Storage Error] Fetch failed for bucket ${bucket}, key ${objectKey}:`, err);
      throw new Error(`Obnovení souboru z MinIO selhalo: ${err.message}`);
    }
  }

  static async deleteObject(bucketName: string | undefined, objectKey: string): Promise<void> {
    const s3 = this.getS3Client();
    const bucket = bucketName || this.getBucketName();

    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        })
      );
    } catch (err: any) {
      console.warn(`[MinIO Storage Warning] Delete failed for bucket ${bucket}, key ${objectKey}:`, err);
    }
  }
}
