const { BlobServiceClient, generateBlobSASQueryParameters, StorageSharedKeyCredential, BlobSASPermissions } = require('@azure/storage-blob');
const config = require('./env');

let blobServiceClient;
let containerClient;

// Initialize Blob Storage client
function initializeStorage() {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.storage.connectionString);
    containerClient = blobServiceClient.getContainerClient(config.storage.container);
    
    // Create container if it doesn't exist
    containerClient.createIfNotExists().catch(err => {
      console.error('Error creating storage container:', err);
    });

    console.log('Azure Blob Storage initialized successfully');
  } catch (error) {
    console.error('Error initializing Blob Storage:', error);
    throw error;
  }
}

// Generate SAS URL for direct upload
function generateSASUrl(blobName, permissions = 'w') {
  try {
    const accountName = config.storage.connectionString.match(/AccountName=([^;]+)/)?.[1];
    const accountKey = config.storage.connectionString.match(/AccountKey=([^;]+)/)?.[1];

    if (!accountName || !accountKey) {
      throw new Error('Invalid storage connection string - missing AccountName or AccountKey');
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    const sasOptions = {
      containerName: config.storage.container,
      blobName: blobName,
      permissions: BlobSASPermissions.parse(permissions),
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000) // 1 hour expiry
    };

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    const blobUrl = `https://${accountName}.blob.core.windows.net/${config.storage.container}/${blobName}`;
    
    return {
      sasUrl: `${blobUrl}?${sasToken}`,
      blobUrl: blobUrl,
      blobName: blobName
    };
  } catch (error) {
    console.error('Error generating SAS URL:', error);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
}

// Get blob URL (CDN URL if configured, otherwise direct blob URL)
function getBlobUrl(blobName) {
  const accountName = config.storage.connectionString.match(/AccountName=([^;]+)/)?.[1];
  return `https://${accountName}.blob.core.windows.net/${config.storage.container}/${blobName}`;
}

// Generate read SAS URL with long expiration (for public access)
function generateReadSASUrl(blobName, expirationHours = 8760) {
  // Default to 1 year (8760 hours = 365 days) for read URLs
  // Azure allows up to 1 year for SAS tokens
  try {
    const accountName = config.storage.connectionString.match(/AccountName=([^;]+)/)?.[1];
    const accountKey = config.storage.connectionString.match(/AccountKey=([^;]+)/)?.[1];

    if (!accountName || !accountKey) {
      throw new Error('Invalid storage connection string - missing AccountName or AccountKey');
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    // Calculate expiration date (max 1 year from now)
    const maxExpirationHours = Math.min(expirationHours, 8760); // Cap at 1 year
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1); // Set to 1 year from now
    
    const sasOptions = {
      containerName: config.storage.container,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('r'), // Read only
      startsOn: new Date(),
      expiresOn: expirationDate
    };

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
    const blobUrl = getBlobUrl(blobName);
    
    return `${blobUrl}?${sasToken}`;
  } catch (error) {
    console.error('Error generating read SAS URL:', error);
    throw new Error(`Failed to generate read URL: ${error.message}`);
  }
}

// Upload file to blob storage
async function uploadFile(blobName, fileBuffer, contentType) {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: { blobContentType: contentType }
    });
    return getBlobUrl(blobName);
  } catch (error) {
    console.error('Error uploading file to blob storage:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

module.exports = {
  blobServiceClient,
  containerClient,
  initializeStorage,
  generateSASUrl,
  generateReadSASUrl,
  getBlobUrl,
  uploadFile
};

