import { rekognition } from '../utils/rekognition.js';
import sharp from 'sharp';
import heicConvert from 'heic-convert';

// You'll need to install this: npm install sharp


// Check if Rekognition is available in the current region
const checkRekognitionAvailability = async () => {
  try {
    await rekognition.listCollections({ MaxResults: 1 }).promise();
    return true;
  } catch (error) {
    if (error.code === 'UnknownEndpoint') {
      console.error(`Rekognition is not available in region: ${rekognition.config.region}`);
      return false;
    }
    throw error;
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
      throw new Error('Rekognition service not available in the current region');
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
    throw new Error('Failed to analyze image: ' + error.message);
  }
};

// Detect explicit content in an image
export const detectModerationLabels = async (imageBuffer) => {
  try {
    const isAvailable = await checkRekognitionAvailability();
    if (!isAvailable) {
      throw new Error('Rekognition service not available in the current region');
    }
    const processedImageBuffer = await validateAndConvertImage(imageBuffer);
    const params = {
      Image: {
        Bytes: processedImageBuffer
      },
      MinConfidence: 60
    };

    const response = await rekognition.detectModerationLabels(params).promise();
    return response.ModerationLabels;
  } catch (error) {
    console.error('Rekognition Moderation Error:', error);
    if (error.code === 'InvalidImageFormatException') {
      throw new Error('The image format is not supported. Please use JPEG or PNG format.');
    } else if (error.code === 'ImageTooLargeException') {
      throw new Error('The image is too large. Maximum size is 15MB.');
    } else if (error.code === 'InvalidParameterException') {
      throw new Error('Invalid image parameters. The image may be corrupted.');
    }

    throw new Error('Failed to analyze image for explicit content: ' + error.message);
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
