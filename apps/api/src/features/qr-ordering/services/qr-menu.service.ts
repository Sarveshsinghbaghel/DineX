import { validateQRToken } from './qr-token.service';
import { getActiveRecommendationProvider } from '../../recommendations/services/recommendations.service';
import { Table } from '../../tables/models/table.model';

export async function getPublicQRMenu(token: string) {
  const qrContext = await validateQRToken(token);
  const table = await Table.findOne({ qrToken: token });

  // Public menu categories & item catalog
  const categories = [
    { id: 'cat-1', name: 'Main Course' },
    { id: 'cat-2', name: 'Breads & Rice' },
    { id: 'cat-3', name: 'Beverages' },
    { id: 'cat-4', name: 'Desserts' },
  ];

  const menuItems = [
    {
      menuItemId: 'ITEM-101',
      itemName: 'Butter Chicken Special',
      categoryName: 'Main Course',
      price: 420,
      description: 'Tender chicken pieces cooked in rich tomato butter gravy.',
      isAvailable: true,
      dietaryFlags: ['Non-Veg'],
      variants: [
        { name: 'Half', price: 250 },
        { name: 'Full', price: 420 },
      ],
      addOns: [
        { name: 'Extra Butter', price: 30 },
        { name: 'Extra Gravy', price: 50 },
      ],
    },
    {
      menuItemId: 'ITEM-102',
      itemName: 'Paneer Tikka Masala',
      categoryName: 'Main Course',
      price: 350,
      description: 'Char-grilled cottage cheese in spiced gravy.',
      isAvailable: true,
      dietaryFlags: ['Vegetarian'],
      variants: [
        { name: 'Half', price: 210 },
        { name: 'Full', price: 350 },
      ],
      addOns: [{ name: 'Extra Paneer', price: 60 }],
    },
    {
      menuItemId: 'ITEM-103',
      itemName: 'Garlic Naan Basket',
      categoryName: 'Breads & Rice',
      price: 120,
      description: 'Leavened flatbread brushed with garlic butter.',
      isAvailable: true,
      dietaryFlags: ['Vegetarian'],
      addOns: [{ name: 'Extra Cheese', price: 40 }],
    },
    {
      menuItemId: 'ITEM-104',
      itemName: 'Jeera Rice Bowl',
      categoryName: 'Breads & Rice',
      price: 160,
      description: 'Basmati rice tempered with cumin seeds.',
      isAvailable: true,
      dietaryFlags: ['Vegetarian', 'Vegan'],
    },
    {
      menuItemId: 'ITEM-105',
      itemName: 'Mango Lassi Chilled',
      categoryName: 'Beverages',
      price: 90,
      description: 'Traditional yogurt drink blended with Alphonso mangoes.',
      isAvailable: true,
      dietaryFlags: ['Vegetarian'],
    },
    {
      menuItemId: 'ITEM-106',
      itemName: 'Gulab Jamun Pair',
      categoryName: 'Desserts',
      price: 110,
      description: 'Soft milk dumplings soaked in cardamom syrup.',
      isAvailable: true,
      dietaryFlags: ['Vegetarian'],
      addOns: [{ name: 'Vanilla Ice Cream Scoop', price: 40 }],
    },
  ];

  // AI recommendations via pluggable RecommendationProvider
  const recProvider = getActiveRecommendationProvider();
  const recommendations = await recProvider.getRecommendations('popular', {
    tenantId: table?.tenantId,
    branchId: table?.branchId?.toString(),
    limit: 4,
  });

  return {
    context: qrContext,
    categories,
    menuItems,
    recommendations,
  };
}
