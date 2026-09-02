import mongoose, { type Document, type Model } from 'mongoose';

export interface SupplierDocument extends Document {
  tenantId: string;
  name: string;
  supplierCode?: string;
  status: 'active' | 'inactive' | 'blocked';
  contacts: Array<{
    name: string;
    phone: string;
    email?: string;
    isPrimary?: boolean;
  }>;
  taxRegistration?: string;
  address?: {
    label?: string;
    recipientName?: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentTermsDays?: number;
  ingredientIds?: mongoose.Types.ObjectId[];
  rating?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new mongoose.Schema<SupplierDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    supplierCode: { type: String, uppercase: true, trim: true, maxlength: 20 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active',
    },
    contacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    taxRegistration: String,
    address: {
      label: String,
      recipientName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'India' },
    },
    paymentTermsDays: { type: Number, default: 0 },
    ingredientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' }],
    rating: { type: Number, min: 1, max: 5 },
    notes: String,
  },
  { timestamps: true },
);

supplierSchema.index({ tenantId: 1, supplierCode: 1 }, { unique: true, sparse: true });
supplierSchema.index({ tenantId: 1, status: 1 });

export const Supplier =
  (mongoose.models.Supplier as Model<SupplierDocument>) ||
  mongoose.model('Supplier', supplierSchema);
