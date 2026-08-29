// Service Cloudinary — instance partagée du SDK (initialisée côté serveur).
// Seul app/api/school_ai/media utilise ce singleton : il appelle init() puis
// accède directement à .cloudinary.uploader.upload_stream pour streamer les buffers.
import { v2 as cloudinary } from 'cloudinary';

const initCloudinary = () => {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
  return cloudinary;
};

class CloudinaryService {
  constructor() {
    this.cloudinary = null;
  }

  // Initialiser le service (côté serveur uniquement)
  init() {
    if (typeof window === 'undefined') {
      this.cloudinary = initCloudinary();
    }
    return this;
  }
}

// Export singleton
const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
