import { rekognition } from '../utils/rekognition.js';
import sharp from 'sharp';
import heicConvert from 'heic-convert';

// Check if Rekognition is available in the current region
const checkRekognitionAvailability = async () => {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn("AWS Rekognition credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) missing in environment.");
      return false;
    }
    await rekognition.listCollections({ MaxResults: 1 }).promise();
    return true;
  } catch (error) {
    console.warn(`Rekognition unavailable (${error.code || error.name || 'Error'}): ${error.message}`);
    return false;
  }
};

// Validate and convert image to a format supported by Rekognition
const validateAndConvertImage = async (imageBuffer) => {
  try {
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      throw new Error("Invalid image buffer");
    }

    let convertedBuffer;

    try {
      // Try normal sharp flow
      const metadata = await sharp(imageBuffer).metadata();
      const supportedFormats = ["jpeg", "jpg", "png"];

      if (!supportedFormats.includes(metadata.format)) {
        console.log(`Converting image from ${metadata.format} to JPEG`);
        convertedBuffer = await sharp(imageBuffer).jpeg({ quality: 90 }).toBuffer();
      } else {
        convertedBuffer = imageBuffer;
      }
    } catch (metaErr) {
      // If sharp cannot read (likely HEIC), use heic-convert
      console.warn("Sharp failed, trying heic-convert:", metaErr.message);

      convertedBuffer = await heicConvert({
        buffer: imageBuffer,
        format: "JPEG",
        quality: 0.9,
      });
    }

    return convertedBuffer;
  } catch (error) {
    console.error("Image validation error:", error);
    throw new Error("Invalid image format: " + error.message);
  }
};


// Detect labels in an image
export const detectImageLabels = async (imageBuffer) => {
  try {
    const isAvailable = await checkRekognitionAvailability();
    if (!isAvailable) {
      return [];
    }
    const processedImageBuffer = await validateAndConvertImage(imageBuffer);
    const params = {
      Image: {
        Bytes: processedImageBuffer
      },
      MaxLabels: 15,
      MinConfidence: 65
    };

    const response = await rekognition.detectLabels(params).promise();
    return response.Labels.map(label => label.Name.toLowerCase());
  } catch (error) {
    console.error('Rekognition Error:', error);
    return [];
  }
};

// Detect explicit content in an image
export const detectModerationLabels = async (imageBuffer) => {
  try {
    const isAvailable = await checkRekognitionAvailability();
    if (!isAvailable) {
      console.warn('Rekognition service not available or credentials missing. Skipping moderation check.');
      return [];
    }
    const processedImageBuffer = await validateAndConvertImage(imageBuffer);
    const params = {
      Image: {
        Bytes: processedImageBuffer
      },
      MinConfidence: 60
    };

    const response = await rekognition.detectModerationLabels(params).promise();
    return response.ModerationLabels || [];
  } catch (error) {
    console.error('Rekognition Moderation Error:', error);
    if (error.code === 'CredentialsError' || error.name === 'CredentialsError') {
      console.warn('AWS Credentials missing/invalid. Skipping explicit content check.');
      return [];
    }
    if (error.code === 'InvalidImageFormatException') {
      throw new Error('The image format is not supported. Please use JPEG or PNG format.');
    } else if (error.code === 'ImageTooLargeException') {
      throw new Error('The image is too large. Maximum size is 15MB.');
    } else if (error.code === 'InvalidParameterException') {
      throw new Error('Invalid image parameters. The image may be corrupted.');
    }

    console.warn('Skipping moderation check due to error:', error.message);
    return [];
  }
};

// Detect inappropriate text in description
export const detectText = async (text) => {
  try {
    const inappropriateTerms = [
      'nude', 'naked', 'porn', 'xxx', 'adult', 'explicit', 'nsfw', 'sexual',
      'graphic', 'violence', 'offensive', 'obscene', 'erotic', 'sexy', 'fuck',
      'shit', 'asshole', 'bitch', 'dick', 'pussy', 'cock', 'whore', 'slut',
    ];

    const lowerText = text.toLowerCase();
    const foundTerms = inappropriateTerms.filter(term => lowerText.includes(term));

    return {
      inappropriate: foundTerms.length > 0,
      terms: foundTerms
    };
  } catch (error) {
    console.error('Text Detection Error:', error);
    throw new Error('Failed to analyze text: ' + error.message);
  }
};
