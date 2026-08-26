import { useState } from "react";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import { useProductCartActions } from "../../hooks/useProductCartActions";

const DEAL_TIERS = [
  {
    id: "best",
    topText: "BEST OF ALL",
    badge: "DEALS",
    price: 9,
  },
  {
    id: "19",
    topText: "DEALS AT",
    badge: "₹19",
    price: 19,
  },
  {
    id: "29",
    topText: "DEALS AT",
    badge: "₹29",
    price: 29,
  },
];

const DEAL_PRODUCTS = {
  best: [
    {
      _id: "deal-9-1",
      name: "Happi Planet | Washing Machine Cleaner",
      sub: "1 pack (18 g)",
      price: 30,
      discountedPrice: 9,
      ratings: 4.8,
      reviewCount: 320,
      stock: 50,
      productImages: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-2",
      name: "Yoga Bar Wholesome Oats & Nut Muesli",
      sub: "1 pack (40 g)",
      price: 40,
      discountedPrice: 9,
      ratings: 4.9,
      reviewCount: 410,
      stock: 45,
      productImages: ["https://images.unsplash.com/photo-1517093729332-d4a963ba6618?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-3",
      name: "Farmley Cream & Onion Roasted Makhana",
      sub: "1 pack (20 g)",
      price: 50,
      discountedPrice: 9,
      ratings: 4.7,
      reviewCount: 290,
      stock: 60,
      productImages: ["https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-4",
      name: "Parle Hide & Seek Caffe Mocha Biscuit",
      sub: "1 pack (100 g)",
      price: 30,
      discountedPrice: 9,
      ratings: 4.8,
      reviewCount: 520,
      stock: 40,
      productImages: ["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-5",
      name: "MOM Masala Mania Roasted Makhana",
      sub: "1 pack (25 g)",
      price: 35,
      discountedPrice: 9,
      ratings: 4.9,
      reviewCount: 680,
      stock: 55,
      productImages: ["https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-6",
      name: "Nutraj Roasted & Salted Snack Mix",
      sub: "1 pack (25 g)",
      price: 45,
      discountedPrice: 9,
      ratings: 4.8,
      reviewCount: 390,
      stock: 50,
      productImages: ["https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-7",
      name: "Organic Fresh Farm Lemons",
      sub: "2 pcs",
      price: 20,
      discountedPrice: 9,
      ratings: 4.9,
      reviewCount: 210,
      stock: 80,
      productImages: ["https://images.unsplash.com/photo-1534531141161-e4160758497b?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-8",
      name: "Fresh Aromatic Curry Leaves",
      sub: "1 bunch (50 g)",
      price: 18,
      discountedPrice: 9,
      ratings: 4.8,
      reviewCount: 150,
      stock: 90,
      productImages: ["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-9",
      name: "Spicy Green Chillies Fresh Harvest",
      sub: "1 pack (100 g)",
      price: 22,
      discountedPrice: 9,
      ratings: 4.9,
      reviewCount: 340,
      stock: 75,
      productImages: ["https://images.unsplash.com/photo-1588879460618-924a49687e8e?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-10",
      name: "Fresh Farm Ginger Root",
      sub: "1 pack (100 g)",
      price: 25,
      discountedPrice: 9,
      ratings: 4.8,
      reviewCount: 280,
      stock: 65,
      productImages: ["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-11",
      name: "ZOFF Special Garam Masala Sachet",
      sub: "1 pack (20 g)",
      price: 20,
      discountedPrice: 9,
      ratings: 4.7,
      reviewCount: 190,
      stock: 85,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-12",
      name: "Farmley Roasted Peri Peri Makhana",
      sub: "1 pack (15 g)",
      price: 35,
      discountedPrice: 9,
      ratings: 4.8,
      reviewCount: 430,
      stock: 50,
      productImages: ["https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-13",
      name: "Yoga Bar Dark Chocolate Protein Bar",
      sub: "1 pc (20 g)",
      price: 35,
      discountedPrice: 9,
      ratings: 4.9,
      reviewCount: 510,
      stock: 40,
      productImages: ["https://images.unsplash.com/photo-1517093729332-d4a963ba6618?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-14",
      name: "Kitchen King Organic Turmeric Powder",
      sub: "1 pack (50 g)",
      price: 22,
      discountedPrice: 9,
      ratings: 4.8,
      reviewCount: 310,
      stock: 70,
      productImages: ["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-15",
      name: "Pure Red Chilli Powder Sachet",
      sub: "1 pack (50 g)",
      price: 25,
      discountedPrice: 9,
      ratings: 4.7,
      reviewCount: 230,
      stock: 60,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-16",
      name: "Fresh Organic Mint Leaves",
      sub: "1 bunch (50 g)",
      price: 18,
      discountedPrice: 9,
      ratings: 4.9,
      reviewCount: 370,
      stock: 85,
      productImages: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-17",
      name: "Organic Whole Coriander Seeds",
      sub: "1 pack (50 g)",
      price: 25,
      discountedPrice: 9,
      ratings: 4.8,
      reviewCount: 260,
      stock: 75,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-18",
      name: "Everest Whole Cumin Seeds (Jeera)",
      sub: "1 pack (25 g)",
      price: 22,
      discountedPrice: 9,
      ratings: 4.8,
      reviewCount: 490,
      stock: 90,
      productImages: ["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-19",
      name: "Organic Small Mustard Seeds (Rai)",
      sub: "1 pack (50 g)",
      price: 20,
      discountedPrice: 9,
      ratings: 4.7,
      reviewCount: 320,
      stock: 80,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-9-20",
      name: "Premium Rock Salt (Sendha Namak)",
      sub: "1 pack (100 g)",
      price: 25,
      discountedPrice: 9,
      ratings: 4.9,
      reviewCount: 540,
      stock: 100,
      productImages: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&h=400&q=80"],
    },
  ],
  19: [
    {
      _id: "deal-19-1",
      name: "Khatika Fresh Idli & Dosa Batter",
      sub: "1 pack (1 kg)",
      price: 99,
      discountedPrice: 19,
      ratings: 4.9,
      reviewCount: 750,
      stock: 70,
      productImages: ["https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-2",
      name: "Parle Hide & Seek Caffe Mocha",
      sub: "1 pack (100 g)",
      price: 30,
      discountedPrice: 19,
      ratings: 4.8,
      reviewCount: 420,
      stock: 50,
      productImages: ["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-3",
      name: "MOM Masala Mania Makhana Pack",
      sub: "1 pack (25 g)",
      price: 30,
      discountedPrice: 19,
      ratings: 4.9,
      reviewCount: 380,
      stock: 45,
      productImages: ["https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-4",
      name: "Yoga Bar High Protein Oats Delight",
      sub: "1 pack (50 g)",
      price: 50,
      discountedPrice: 19,
      ratings: 4.7,
      reviewCount: 310,
      stock: 60,
      productImages: ["https://images.unsplash.com/photo-1517093729332-d4a963ba6618?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-5",
      name: "Fresh Palak Bunch (Triple Washed)",
      sub: "1 pack (250 g)",
      price: 40,
      discountedPrice: 19,
      ratings: 4.9,
      reviewCount: 590,
      stock: 80,
      productImages: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-6",
      name: "Peeled Garlic Cloves Fresh Pack",
      sub: "1 pack (100 g)",
      price: 45,
      discountedPrice: 19,
      ratings: 4.8,
      reviewCount: 610,
      stock: 75,
      productImages: ["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-7",
      name: "Fresh Organic Methi Bunch",
      sub: "1 pack (250 g)",
      price: 35,
      discountedPrice: 19,
      ratings: 4.9,
      reviewCount: 420,
      stock: 85,
      productImages: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-8",
      name: "Fresh Shepu / Dill Leaves",
      sub: "1 pack (200 g)",
      price: 35,
      discountedPrice: 19,
      ratings: 4.8,
      reviewCount: 310,
      stock: 70,
      productImages: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-9",
      name: "Sliced Beetroot Salad Fresh Pack",
      sub: "1 pack (250 g)",
      price: 40,
      discountedPrice: 19,
      ratings: 4.8,
      reviewCount: 360,
      stock: 65,
      productImages: ["https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-10",
      name: "Diced Tomato & Chilli Salad Combo",
      sub: "1 pack (200 g)",
      price: 35,
      discountedPrice: 19,
      ratings: 4.7,
      reviewCount: 280,
      stock: 90,
      productImages: ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-11",
      name: "Fresh Green Peas (Matar)",
      sub: "1 pack (250 g)",
      price: 45,
      discountedPrice: 19,
      ratings: 4.9,
      reviewCount: 640,
      stock: 100,
      productImages: ["https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-12",
      name: "Organic Crisp Salad Cucumber",
      sub: "1 pack (500 g)",
      price: 40,
      discountedPrice: 19,
      ratings: 4.8,
      reviewCount: 520,
      stock: 80,
      productImages: ["https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-13",
      name: "Tender Sweet Corn Kernels",
      sub: "1 pack (200 g)",
      price: 45,
      discountedPrice: 19,
      ratings: 4.9,
      reviewCount: 470,
      stock: 85,
      productImages: ["https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-14",
      name: "Curry Leaves & Mint Kitchen Combo",
      sub: "1 pack (150 g)",
      price: 35,
      discountedPrice: 19,
      ratings: 4.8,
      reviewCount: 390,
      stock: 75,
      productImages: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-15",
      name: "ZOFF Kashmiri Red Chilli Powder",
      sub: "1 pack (50 g)",
      price: 40,
      discountedPrice: 19,
      ratings: 4.7,
      reviewCount: 430,
      stock: 60,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-16",
      name: "Everest Aromatic Coriander Powder",
      sub: "1 pack (100 g)",
      price: 38,
      discountedPrice: 19,
      ratings: 4.8,
      reviewCount: 550,
      stock: 90,
      productImages: ["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-17",
      name: "Crunchy Salted Roasted Peanuts",
      sub: "1 pack (150 g)",
      price: 45,
      discountedPrice: 19,
      ratings: 4.9,
      reviewCount: 680,
      stock: 110,
      productImages: ["https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-18",
      name: "Organic Polished Chana Dal",
      sub: "1 pack (250 g)",
      price: 42,
      discountedPrice: 19,
      ratings: 4.8,
      reviewCount: 370,
      stock: 75,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-19",
      name: "Organic Yellow Moong Dal",
      sub: "1 pack (250 g)",
      price: 45,
      discountedPrice: 19,
      ratings: 4.9,
      reviewCount: 490,
      stock: 85,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-19-20",
      name: "Premium Pearl Whole Sabudana",
      sub: "1 pack (250 g)",
      price: 45,
      discountedPrice: 19,
      ratings: 4.8,
      reviewCount: 560,
      stock: 95,
      productImages: ["https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&h=400&q=80"],
    },
  ],
  29: [
    {
      _id: "deal-29-1",
      name: "Farmley Cream & Onion Makhana",
      sub: "1 pack (20 g)",
      price: 50,
      discountedPrice: 29,
      ratings: 4.8,
      reviewCount: 450,
      stock: 60,
      productImages: ["https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-2",
      name: "ZOFF White Till | White Sesame Spices",
      sub: "1 pack (100 g)",
      price: 60,
      discountedPrice: 29,
      ratings: 4.9,
      reviewCount: 380,
      stock: 50,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-3",
      name: "Farmley Smoky BBQ Party Mix",
      sub: "1 pack (25 g)",
      price: 50,
      discountedPrice: 29,
      ratings: 4.7,
      reviewCount: 290,
      stock: 40,
      productImages: ["https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-4",
      name: "Farmley Tangy Tomato Roasted Makhana",
      sub: "1 pack (20 g)",
      price: 50,
      discountedPrice: 29,
      ratings: 4.8,
      reviewCount: 360,
      stock: 55,
      productImages: ["https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-5",
      name: "MOM Cream N Onion Roasted Makhana",
      sub: "1 pack (20 g)",
      price: 50,
      discountedPrice: 29,
      ratings: 4.9,
      reviewCount: 480,
      stock: 65,
      productImages: ["https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-6",
      name: "Nutraj Snack Fiesta Roasted Mix",
      sub: "1 pack (25 g)",
      price: 49,
      discountedPrice: 29,
      ratings: 4.8,
      reviewCount: 310,
      stock: 45,
      productImages: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-7",
      name: "Fresh Nashik Red Tomatoes",
      sub: "1 pack (500 g)",
      price: 60,
      discountedPrice: 29,
      ratings: 4.9,
      reviewCount: 820,
      stock: 120,
      productImages: ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-8",
      name: "Fresh Broccoli Florets Clean Pack",
      sub: "1 pack (200 g)",
      price: 70,
      discountedPrice: 29,
      ratings: 4.8,
      reviewCount: 540,
      stock: 70,
      productImages: ["https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-9",
      name: "Peeled Baby Potatoes Organic",
      sub: "1 pack (500 g)",
      price: 55,
      discountedPrice: 29,
      ratings: 4.9,
      reviewCount: 610,
      stock: 90,
      productImages: ["https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-10",
      name: "Fresh Tender Baby Corn Pack",
      sub: "1 pack (200 g)",
      price: 65,
      discountedPrice: 29,
      ratings: 4.8,
      reviewCount: 410,
      stock: 65,
      productImages: ["https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-11",
      name: "Chopped Red Onions Kitchen Pack",
      sub: "1 pack (250 g)",
      price: 55,
      discountedPrice: 29,
      ratings: 4.9,
      reviewCount: 730,
      stock: 100,
      productImages: ["https://images.unsplash.com/photo-1618512496248-a07fe83aa8ce?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-12",
      name: "Julienne Cut Carrots & French Beans",
      sub: "1 pack (250 g)",
      price: 60,
      discountedPrice: 29,
      ratings: 4.8,
      reviewCount: 480,
      stock: 80,
      productImages: ["https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-13",
      name: "Fresh White Button Mushrooms",
      sub: "1 pack (200 g)",
      price: 65,
      discountedPrice: 29,
      ratings: 4.9,
      reviewCount: 670,
      stock: 85,
      productImages: ["https://images.unsplash.com/photo-1504470695779-75300268aa0e?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-14",
      name: "Organic Sweet Potato Harvest",
      sub: "1 pack (500 g)",
      price: 55,
      discountedPrice: 29,
      ratings: 4.8,
      reviewCount: 390,
      stock: 75,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-15",
      name: "Pav Bhaji Special Chopped Mix",
      sub: "1 pack (400 g)",
      price: 75,
      discountedPrice: 29,
      ratings: 4.9,
      reviewCount: 890,
      stock: 110,
      productImages: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-16",
      name: "Chowmein & Stir Fry Veggie Mix",
      sub: "1 pack (300 g)",
      price: 70,
      discountedPrice: 29,
      ratings: 4.8,
      reviewCount: 520,
      stock: 90,
      productImages: ["https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-17",
      name: "Organic Raw Peanuts Premium",
      sub: "1 pack (250 g)",
      price: 55,
      discountedPrice: 29,
      ratings: 4.8,
      reviewCount: 430,
      stock: 95,
      productImages: ["https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-18",
      name: "Premium Chitra Rajma Beans",
      sub: "1 pack (250 g)",
      price: 60,
      discountedPrice: 29,
      ratings: 4.9,
      reviewCount: 620,
      stock: 80,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-19",
      name: "Organic Large Kabuli Chana",
      sub: "1 pack (250 g)",
      price: 65,
      discountedPrice: 29,
      ratings: 4.8,
      reviewCount: 470,
      stock: 75,
      productImages: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&h=400&q=80"],
    },
    {
      _id: "deal-29-20",
      name: "Farmley Roasted Salted Cashews",
      sub: "1 pack (30 g)",
      price: 75,
      discountedPrice: 29,
      ratings: 4.9,
      reviewCount: 910,
      stock: 120,
      productImages: ["https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&h=400&q=80"],
    },
  ],
};

export function getDealProductById(id) {
  const key = String(id || "");
  if (!key.startsWith("deal-")) return null;
  for (const list of Object.values(DEAL_PRODUCTS)) {
    const found = (list || []).find((item) => String(item._id) === key);
    if (found) {
      return {
        ...found,
        variantType: found.variantType || "single",
        discountedPrice: found.salePrice ?? found.discountedPrice,
        isActive: true,
      };
    }
  }
  return null;
}

export default function DealsStartingAt9Section() {
  const [activeTier, setActiveTier] = useState("best");
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const products = DEAL_PRODUCTS[activeTier] || DEAL_PRODUCTS.best;

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  return (
    <section className="ml-4 sm:ml-6 mr-0 my-2 sm:my-3">
      {/* 1. Header Title & Subtitle (Outside Card) */}
      <div className="text-center mb-1.5 pr-4 sm:pr-6">
        <h2 className="text-lg sm:text-xl font-black text-[#0B6E28] uppercase tracking-tight">
          DEALS STARTING AT ₹9
        </h2>
        <p className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">
          Add Any 10 Items
        </p>
      </div>

      {/* 2. Main Light Gray to Pure White Gradient Card Container (Sleek Compact Height) */}
      <div className="bg-gradient-to-r from-[#E2E8F0] via-[#F1F5F9] to-white pl-2.5 sm:pl-3.5 pr-0 py-2 rounded-l-3xl rounded-r-none border-0 shadow-2xs">
        {/* Main Flex Container: Left Tier Sidebar + Right Product Scroll */}
        <div className="flex gap-2 sm:gap-2.5 items-stretch">
        
        {/* Left Tier Sidebar */}
        <div className="w-[68px] sm:w-[90px] shrink-0 bg-white rounded-2xl border border-slate-100 flex flex-col divide-y divide-slate-100 overflow-hidden shadow-2xs">
          {DEAL_TIERS.map((tier) => {
            const isActive = activeTier === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setActiveTier(tier.id)}
                className={`relative flex-1 flex flex-col justify-center items-center text-center px-1 py-1.5 transition-colors duration-200 cursor-pointer ${
                  isActive ? "bg-[#DCFCE7]" : "bg-white hover:bg-slate-50"
                }`}
              >
                {/* Active Left Indicator Line */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-[#0C831F] rounded-r-sm" />
                )}

                <span className={`text-[9px] sm:text-[10.5px] leading-tight ${
                  isActive ? "font-black text-emerald-950" : "font-bold text-slate-700"
                }`}>
                  {tier.topText}
                </span>

                {tier.id === "best" ? (
                  <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[8.5px] sm:text-[10px] font-black uppercase shadow-2xs ${
                    isActive ? "bg-emerald-700 text-white" : "bg-emerald-600/80 text-white"
                  }`}>
                    {tier.badge}
                  </span>
                ) : (
                  <div className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-black shadow-2xs ${
                    isActive ? "bg-emerald-700 text-white" : "bg-emerald-600/80 text-white"
                  }`}>
                    {tier.badge}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right 2-Row Horizontal Scroll Grid with Standard App Product Cards */}
        <div className="flex-1 min-w-0 flex items-center">
          <div className="w-full grid grid-rows-2 auto-cols-[135px] sm:auto-cols-[165px] grid-flow-col gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar py-1">
            {products.map((item) => (
              <div
                key={item._id}
                className="w-full shrink-0 snap-center rounded-2xl bg-white p-2 shadow-2xs border-0 hover:shadow-xs transition-all duration-200"
              >
                <QuickCommerceProductCard
                  {...cardProps(item)}
                  layout="grid"
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  </section>
);
}
