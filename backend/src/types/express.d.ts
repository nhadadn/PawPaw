import multer from 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      file?: Multer.File;
      files?: { [fieldname: string]: Multer.File[] } | Multer.File[];
    }

    // Ensure Multer namespace exists within Express for backward compatibility
    namespace Multer {
      interface File extends multer.File {}
    }
  }
}

export {};
