import { Schema, model } from 'mongoose';
import { IImage } from '../interface/imageInterface';

const imageSchema = new Schema<IImage>({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  ext_name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const ImageModel = model<IImage>('Image1', imageSchema);
