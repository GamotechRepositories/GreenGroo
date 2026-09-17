import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/dbconfig.js";
import Product from "../models/Product.js";

// Dictionary of exactly 20 distinct products per subcategory
const productDictionary = {
  Vegetables: {
    section: "greengrocc", storeType: "main",
    subcategories: {
      "Daily Veggies": ["Red Tomato", "White Onion", "Red Onion", "Potato", "Green Capsicum", "Red Capsicum", "Yellow Capsicum", "Cauliflower", "Cabbage", "Green Peas", "Lady Finger (Bhindi)", "Bottle Gourd (Lauki)", "Bitter Gourd (Karela)", "Ridge Gourd (Tori)", "Sponge Gourd", "Pumpkin", "Brinjal (Baingan)", "Cucumber", "Lemon", "Green Chilli"],
      "Leafy Greens": ["Spinach (Palak)", "Coriander Leaves", "Mint Leaves (Pudina)", "Fenugreek (Methi)", "Amaranth Leaves", "Mustard Greens (Sarson)", "Curry Leaves", "Spring Onion", "Dill Leaves", "Celery", "Lettuce Iceberg", "Romaine Lettuce", "Rocket Leaves", "Swiss Chard", "Kale", "Bok Choy", "Parsley", "Basil Leaves", "Lemon Grass", "Radish Leaves"],
      "Exotic Vegetables": ["Broccoli", "Zucchini Green", "Zucchini Yellow", "Cherry Tomatoes", "Mushroom Button", "Red Cabbage", "Asparagus", "Avocado", "Baby Corn", "Sweet Corn", "Jalapeno", "Leeks", "Snow Peas", "Artichoke", "Brussels Sprouts", "Red Radish", "Turnip", "Water Chestnut", "Bamboo Shoot", "Green Olives"],
      "Root Vegetables": ["Carrot", "Beetroot", "Radish White", "Sweet Potato", "Yam (Suran)", "Colocasia (Arbi)", "Lotus Stem (Kamal Kakdi)", "Garlic", "Ginger", "Turmeric Root", "Parsnip", "Rutabaga", "Daikon", "Celeriac", "Jicama", "Taro Root", "Cassava", "Maca Root", "Arrowroot", "Watermelon Radish"]
    }
  },
  Fruits: {
    section: "greengrocc", storeType: "main",
    subcategories: {
      "Seasonal Fruits": ["Alphonso Mango", "Kesar Mango", "Banganapalli Mango", "Watermelon", "Muskmelon", "Litchi", "Jamun", "Custard Apple", "Guava", "Plum", "Peach", "Pear", "Strawberry", "Cherry", "Apricot", "Fig", "Mulberry", "Jackfruit", "Sweet Lime", "Tangerine"],
      "Citrus": ["Nagpur Orange", "Kinnow", "Valencia Orange", "Malta Orange", "Mosambi", "Lemon", "Grapefruit", "Pomelo", "Kaffir Lime", "Clementine", "Mandarin", "Tangerine", "Blood Orange", "Bergamot", "Yuzu", "Key Lime", "Sudachi", "Ugli Fruit", "Calamansi", "Bitter Orange"],
      "Daily Fruits": ["Robusta Banana", "Yelakki Banana", "Red Banana", "Papaya", "Pomegranate", "Apple Shimla", "Apple Fuji", "Apple Washington", "Apple Green", "Green Grapes", "Black Grapes", "Red Grapes", "Pineapple", "Sapota (Chikoo)", "Coconut", "Tender Coconut", "Dates", "Watermelon Striped", "Pear Indian", "Guava Pink"],
      "Exotic Fruits": ["Kiwi Green", "Kiwi Gold", "Dragon Fruit White", "Dragon Fruit Red", "Rambutan", "Mangosteen", "Passion Fruit", "Blueberry", "Blackberry", "Raspberry", "Avocado Hass", "Persimmon", "Durian", "Star Fruit", "Longan", "Lychee", "Goji Berries", "Acai Berries", "Cranberry", "Elderberry"]
    }
  },
  Dairy: {
    section: "greengrocc", storeType: "main",
    subcategories: {
      "Milk & Curd": ["Amul Taaza Milk", "Amul Gold Milk", "Mother Dairy Toned Milk", "Mother Dairy Full Cream", "Nandini Milk", "A2 Cow Milk", "Buffalo Milk", "Goat Milk", "Camel Milk", "Amul Masti Dahi", "Mother Dairy Curd", "Nestle a+ Curd", "Epigamia Greek Yogurt", "Flavored Yogurt Mango", "Flavored Yogurt Strawberry", "Lassi Sweet", "Lassi Salted", "Buttermilk (Chaas)", "Kefir", "Probiotic Milk"],
      "Paneer & Cheese": ["Amul Malai Paneer", "Mother Dairy Paneer", "Gowardhan Paneer", "Tofu (Soy Paneer)", "Amul Cheese Slices", "Amul Cheese Cubes", "Britannia Cheese Block", "Mozzarella Cheese", "Cheddar Cheese", "Parmesan Cheese", "Gouda Cheese", "Feta Cheese", "Ricotta Cheese", "Cream Cheese", "Swiss Cheese", "Brie Cheese", "Camembert", "Blue Cheese", "Halloumi", "Mascarpone"],
      "Butter & Ghee": ["Amul Butter Salted", "Amul Butter Unsalted", "Mother Dairy Butter", "Nutralite Butter Spread", "Peanut Butter Creamy", "Peanut Butter Crunchy", "Almond Butter", "Cashew Butter", "Amul Pure Ghee", "Mother Dairy Ghee", "Patanjali Cow Ghee", "Gowardhan Ghee", "A2 Desi Cow Ghee", "Buffalo Ghee", "Organic Ghee", "Garlic Butter", "Herb Butter", "Vegan Butter", "Truffle Butter", "Clarified Butter"]
    }
  },
  Grains: {
    section: "supermall", storeType: "mall",
    subcategories: {
      "Basmati Rice": ["Daawat Rozana", "India Gate Classic", "Kohinoor Super", "Fortune Basmati", "Lal Qilla Basmati", "Patanjali Basmati", "Aeroplane Basmati", "Tilda Basmati", "Mahmood Basmati", "Abu Kass", "Mubarak Basmati", "Alishaan Basmati", "Himalayan Crown", "Royal Basmati", "Zebra Basmati", "Pansari Basmati", "Shriram Basmati", "Oswal Basmati", "Tirupati Basmati", "Premium 1121 Basmati"],
      "Atta & Flours": ["Aashirvaad Atta", "Fortune Chakki Atta", "Patanjali Atta", "Nature Fresh Atta", "Pillsbury Atta", "Multigrain Atta", "Gluten Free Atta", "Besan (Gram Flour)", "Maida (Refined Flour)", "Sooji (Semolina)", "Rice Flour", "Ragi Flour", "Jowar Flour", "Bajra Flour", "Makki Atta", "Oats Flour", "Almond Flour", "Coconut Flour", "Soyabean Flour", "Buckwheat Flour (Kuttu)"],
      "Millets": ["Pearl Millet (Bajra)", "Finger Millet (Ragi)", "Sorghum (Jowar)", "Foxtail Millet", "Little Millet", "Barnyard Millet", "Kodo Millet", "Proso Millet", "Amaranth Seeds", "Quinoa White", "Quinoa Red", "Quinoa Black", "Buckwheat", "Teff", "Fonio", "Job's Tears", "Broomcorn Millet", "Guinea Millet", "Browntop Millet", "Mixed Millets"]
    }
  },
  Pulses: {
    section: "supermall", storeType: "mall",
    subcategories: {
      "Dals & Pulses": ["Toor Dal (Arhar)", "Moong Dal Yellow", "Moong Dal Green", "Chana Dal", "Urad Dal Black", "Urad Dal White", "Masoor Dal Red", "Masoor Dal Whole", "Lobia (Black Eyed Peas)", "Moth Dal", "Panchratna Dal", "Horse Gram (Kulthi)", "Green Peas Dry", "White Peas Dry", "Yellow Peas", "Split Chickpeas", "Roasted Chana", "Pigeon Peas", "Lentils", "Black Gram"],
      "Beans": ["Rajma Chitra", "Rajma Sharmili", "Rajma Kashmiri", "Kabuli Chana (White)", "Kala Chana (Black)", "Soyabean Whole", "Lima Beans", "Pinto Beans", "Black Beans", "Navy Beans", "Cannellini Beans", "Kidney Beans", "Adzuki Beans", "Mung Beans", "Broad Beans (Fava)", "Cranberry Beans", "Flageolet Beans", "Great Northern Beans", "Marrow Beans", "Tepary Beans"],
      "Sprouts": ["Mixed Sprouts", "Moong Sprouts", "Chana Sprouts", "Moth Sprouts", "Alfalfa Sprouts", "Broccoli Sprouts", "Radish Sprouts", "Clover Sprouts", "Lentil Sprouts", "Soybean Sprouts", "Pea Sprouts", "Sunflower Sprouts", "Pumpkin Sprouts", "Wheat Sprouts", "Barley Sprouts", "Oat Sprouts", "Quinoa Sprouts", "Amaranth Sprouts", "Buckwheat Sprouts", "Fenugreek Sprouts"]
    }
  },
  Grocery: {
    section: "supermall", storeType: "mall",
    subcategories: {
      "Salt & Sugar": ["Tata Salt", "Catch Salt", "Aashirvaad Salt", "Patanjali Salt", "Himalayan Pink Salt", "Black Salt (Kala Namak)", "Rock Salt (Sendha Namak)", "Sea Salt", "Low Sodium Salt", "Madhur Sugar", "Trust Sugar", "Parry's Sugar", "Brown Sugar", "Demerara Sugar", "Cubes Sugar", "Powdered Sugar", "Jaggery Block", "Jaggery Powder", "Palm Jaggery", "Stevia Powder"],
      "Snacks": ["Haldiram Aloo Bhujia", "Haldiram Moong Dal", "Lays Classic Salted", "Lays Magic Masala", "Kurkure Masala Munch", "Bingo Mad Angles", "Doritos Nacho Cheese", "Pringles Original", "Cheetos", "Uncle Chipps", "Bikano Bikaneri Bhujia", "Balaji Wafers", "Too Yumm", "Makhanas Roasted", "Khakhra", "Diet Chivda", "Banana Chips", "Tapioca Chips", "Nachos", "Popcorn"],
      "Noodles & Pasta": ["Maggi Masala Noodles", "Yippee Noodles", "Top Ramen", "Wai Wai Noodles", "Ching's Secret Noodles", "Hakka Noodles", "Rice Noodles", "Udon Noodles", "Soba Noodles", "Macaroni Pasta", "Penne Pasta", "Fusilli Pasta", "Spaghetti", "Farfalle Pasta", "Linguine", "Fettuccine", "Ravioli", "Lasagna Sheets", "Whole Wheat Pasta", "Quinoa Pasta"]
    }
  },
  Oils: {
    section: "supermall", storeType: "mall",
    subcategories: {
      "Cooking Oils": ["Fortune Sunflower Oil", "Saffola Gold", "Sundrop Heart", "Dhara Mustard Oil", "Patanjali Mustard Oil", "Emami Healthy & Tasty", "Gemini Refined Oil", "Sweekar Sunflower Oil", "Nature Fresh", "Borges Olive Oil", "Figaro Olive Oil", "Disano Extra Virgin Olive", "KLF Coconut Oil", "Parachute Coconut Oil", "Idhayam Sesame Oil", "Puja Groundnut Oil", "Rice Bran Oil", "Canola Oil", "Avocado Oil", "Flaxseed Oil"],
      "Ghee & Vanaspati": ["Dalda Vanaspati", "Rath Vanaspati", "Gagan Vanaspati", "Amul Pure Ghee", "Mother Dairy Ghee", "Patanjali Cow Ghee", "Gowardhan Ghee", "A2 Desi Cow Ghee", "Buffalo Ghee", "Organic Ghee", "Baidyanath Ghee", "Ananda Ghee", "Nova Ghee", "Madhusudan Ghee", "Verka Ghee", "Vita Ghee", "Nandini Ghee", "Milma Ghee", "Aavin Ghee", "Sudha Ghee"]
    }
  },
  Spices: {
    section: "supermall", storeType: "mall",
    subcategories: {
      "Powdered Spices": ["Everest Turmeric Powder", "Catch Turmeric Powder", "MDH Lal Mirch", "Everest Kashmiri Lal", "Catch Coriander Powder", "MDH Coriander Powder", "Everest Cumin Powder", "Catch Black Pepper Powder", "MDH Dry Mango Powder", "Everest Hing Powder", "Catch Black Salt Powder", "MDH White Pepper", "Everest Dry Ginger Powder", "Garlic Powder", "Onion Powder", "Cinnamon Powder", "Clove Powder", "Cardamom Powder", "Fennel Powder", "Nutmeg Powder"],
      "Blended Spices": ["MDH Garam Masala", "Everest Garam Masala", "Catch Sabzi Masala", "MDH Chana Masala", "Everest Meat Masala", "Catch Chicken Masala", "MDH Pav Bhaji Masala", "Everest Chaat Masala", "Catch Kitchen King Masala", "MDH Sambhar Masala", "Everest Biryani Masala", "Catch Fish Masala", "MDH Rajma Masala", "Everest Shahi Paneer Masala", "Catch Chhole Masala", "MDH Jaljeera Masala", "Everest Pani Puri Masala", "Catch Raita Masala", "MDH Tandoori Masala", "Everest Tea Masala"],
      "Whole Spices": ["Cumin Seeds (Jeera)", "Mustard Seeds (Rai)", "Black Pepper Whole", "Cloves (Laung)", "Green Cardamom (Elaichi)", "Black Cardamom", "Cinnamon Sticks (Dalchini)", "Bay Leaves (Tej Patta)", "Star Anise", "Mace (Javitri)", "Nutmeg Whole", "Fennel Seeds (Saunf)", "Fenugreek Seeds (Methi)", "Coriander Seeds (Dhania)", "Dry Red Chilli", "Ajwain Seeds", "Poppy Seeds (Khus Khus)", "Sesame Seeds White", "Sesame Seeds Black", "Nigella Seeds (Kalonji)"]
    }
  },
  "Dry Fruits": {
    section: "supermall", storeType: "mall",
    subcategories: {
      "Dry Fruits & Nuts": ["California Almonds", "Mamra Badam", "Cashews W320", "Cashews W240", "Pistachios Roasted", "Pistachios Salted", "Walnuts Kernels", "Walnuts with Shell", "Green Raisins", "Black Raisins", "Munakka", "Dried Figs (Anjeer)", "Dried Apricots", "Dried Dates (Chuara)", "Pinenuts (Chilgoza)", "Pecan Nuts", "Macadamia Nuts", "Brazil Nuts", "Hazelnuts", "Dried Cranberries"],
      "Seeds": ["Chia Seeds", "Flax Seeds", "Pumpkin Seeds", "Sunflower Seeds", "Watermelon Seeds", "Muskmelon Seeds", "Sesame Seeds", "Hemp Seeds", "Quinoa Seeds", "Basil Seeds (Sabja)", "Lotus Seeds (Makhana)", "Poppy Seeds", "Nigella Seeds", "Carom Seeds", "Fennel Seeds", "Cumin Seeds", "Mustard Seeds", "Fenugreek Seeds", "Coriander Seeds", "Pomegranate Seeds"]
    }
  },
  Organic: {
    section: "greengrocc", storeType: "main",
    subcategories: {
      "Organic Pantry": ["Organic Tur Dal", "Organic Moong Dal", "Organic Chana Dal", "Organic Urad Dal", "Organic Basmati Rice", "Organic Brown Rice", "Organic Red Rice", "Organic Wheat Atta", "Organic Multigrain Atta", "Organic Sugar", "Organic Jaggery", "Organic Honey", "Organic Mustard Oil", "Organic Sunflower Oil", "Organic Coconut Oil", "Organic Turmeric Powder", "Organic Chilli Powder", "Organic Coriander Powder", "Organic Cumin Seeds", "Organic Black Pepper"],
      "Superfoods": ["Spirulina Powder", "Moringa Powder", "Wheatgrass Powder", "Maca Powder", "Matcha Tea Powder", "Acai Berry Powder", "Camu Camu Powder", "Goji Berries", "Cacao Nibs", "Hemp Hearts", "Chia Seeds Organic", "Flax Seeds Organic", "Ashwagandha Powder", "Brahmi Powder", "Shatavari Powder", "Triphala Powder", "Amla Powder", "Giloy Powder", "Tulsi Drops", "Noni Juice"]
    }
  },
  Beverages: {
    section: "supermall", storeType: "mall",
    subcategories: {
      "Cold Drinks": ["Coca-Cola", "Diet Coke", "Sprite", "Fanta", "Thums Up", "Limca", "Maaza", "Slice", "Frooti", "Pepsi", "Diet Pepsi", "7UP", "Mirinda", "Mountain Dew", "Appy Fizz", "B Natural", "Paper Boat Aamras", "Jeeru", "Catch Club Soda", "Kinley Water"],
      "Energy Drinks": ["Red Bull", "Monster Energy", "Gatorade Blue", "Gatorade Orange", "Sting Energy", "Hell Energy", "Cloud 9", "Tzinga", "Enerzal", "Glucon-D", "Tang Orange", "Rasna", "Bournvita", "Horlicks", "Complan", "Boost", "Milo", "Ensure", "Protinex", "Pediasure"],
      "Tea & Coffee": ["Taj Mahal Tea", "Red Label Tea", "Tata Tea Gold", "Tata Tea Premium", "Lipton Green Tea", "Tetley Green Tea", "Wagh Bakri Tea", "Society Tea", "Girnar Tea", "Twinings Earl Grey", "Nescafe Classic", "Nescafe Gold", "Bru Instant Coffee", "Bru Gold", "Davidoff Coffee", "Continental Coffee", "Filter Coffee Powder", "Tata Coffee Grand", "Sleepy Owl Cold Brew", "Blue Tokai Coffee"],
      "Juices": ["Tropicana Orange", "Tropicana Mixed Fruit", "Real Fruit Apple", "Real Fruit Guava", "B Natural Litchi", "B Natural Mixed Fruit", "Paper Boat Anar", "Paper Boat Jaljeera", "Aloe Vera Juice", "Amla Juice", "Giloy Tulsi Juice", "Karela Jamun Juice", "Wheatgrass Juice", "Noni Juice", "Cranberry Juice", "Pomegranate Juice", "Grape Juice", "Pineapple Juice", "Tomato Juice", "Carrot Juice"]
    }
  },
  Bakery: {
    section: "greengrocc", storeType: "main",
    subcategories: {
      "Breads & Buns": ["White Bread", "Brown Bread", "Multigrain Bread", "Whole Wheat Bread", "Milk Bread", "Sandwich Bread", "Garlic Bread", "Focaccia Bread", "Sourdough Bread", "Baguette", "Pita Bread", "Burger Buns", "Hot Dog Buns", "Pav Buns", "Sweet Buns", "Fruit Buns", "Croissant", "Bagel", "English Muffin", "Ciabatta"],
      "Cookies & Rusk": ["Britannia Good Day", "Parle-G", "Sunfeast Dark Fantasy", "Oreo Cookies", "Unibic Choco Chip", "Milano Cookies", "Bourbon Biscuits", "Marie Gold", "Monaco Biscuits", "Krackjack", "Hide & Seek", "Nutri Choice", "Britannia Milk Rusk", "Parle Rusk", "Elaichi Rusk", "Suzy Rusk", "Cake Rusk", "Jeera Butter", "Osmania Biscuit", "Nankhatai"],
      "Cakes & Muffins": ["Britannia Bar Cake", "Winkies Cake", "Elite Plum Cake", "Muffins Choco", "Muffins Vanilla", "Muffins Blueberry", "Cupcakes", "Brownie", "Lava Cake", "Swiss Roll", "Fruit Cake", "Sponge Cake", "Pound Cake", "Carrot Cake", "Red Velvet Cake", "Black Forest Pastry", "Pineapple Pastry", "Chocolate Truffle", "Cheese Cake", "Tiramisu"]
    }
  },
  Ready2Cook: {
    section: "ready2cook", storeType: "festive",
    subcategories: {
      "Chopped": ["Chopped Onion", "Chopped Tomato", "Chopped Cabbage", "Chopped Carrot", "Chopped Capsicum", "Chopped Beans", "Chopped Coriander", "Chopped Green Chilli", "Chopped Garlic", "Chopped Ginger", "Diced Potato", "Diced Paneer", "Sliced Mushroom", "Sliced Onion", "Grated Coconut", "Grated Carrot", "Grated Cheese", "Julienne Ginger", "Chopped Pineapple", "Chopped Watermelon"],
      "Peeled": ["Peeled Garlic", "Peeled Onion", "Peeled Potato", "Peeled Carrot", "Peeled Pomegranate", "Peeled Sweet Corn", "Peeled Green Peas", "Peeled Baby Corn", "Peeled Cucumber", "Peeled Bottle Gourd", "Peeled Ridge Gourd", "Peeled Bitter Gourd", "Peeled Apple", "Peeled Orange", "Peeled Sweet Lime", "Peeled Papaya", "Peeled Pineapple", "Peeled Jackfruit", "Peeled Litchi", "Peeled Almonds"],
      "Mix Kits": ["Pav Bhaji Mix", "Sambar Mix", "Undhiyu Mix", "Avial Mix", "Veg Makhanwala Mix", "Mix Veg Curry Kit", "Biryani Veg Mix", "Pulao Veg Mix", "Salad Kit", "Soup Kit", "Stir Fry Mix", "Pasta Veg Mix", "Noodle Veg Mix", "Cutlet Mix", "Pakora Mix", "Bhel Puri Kit", "Pani Puri Kit", "Sprout Chaat Kit", "Fruit Salad Kit", "Smoothie Kit"],
      "Leafy Cleaned": ["Cleaned Spinach", "Cleaned Methi", "Cleaned Coriander", "Cleaned Mint", "Cleaned Curry Leaves", "Cleaned Amaranth", "Cleaned Mustard Greens", "Cleaned Spring Onion", "Cleaned Dill", "Cleaned Lettuce", "Cleaned Rocket", "Cleaned Swiss Chard", "Cleaned Kale", "Cleaned Bok Choy", "Cleaned Parsley", "Cleaned Basil", "Cleaned Celery", "Cleaned Radish Leaves", "Cleaned Bathua", "Cleaned Drumstick Leaves"]
    }
  }
};

async function runMassiveSeed() {
  try {
    console.log("Connecting to MongoDB for Massive Specific Product Seeding...");
    await connectDB();

    console.log("Clearing all existing products in GreenGroccproducts collection...");
    await Product.deleteMany({});

    const allProducts = [];
    let skuCounter = 1000;

    for (const [categoryName, categoryData] of Object.entries(productDictionary)) {
      for (const [subcategory, productNames] of Object.entries(categoryData.subcategories)) {
        
        for (let i = 0; i < productNames.length; i++) {
          skuCounter++;
          
          const name = productNames[i];
          const sku = `GG-${categoryName.substring(0,3).toUpperCase()}-${skuCounter}`;
          
          const basePrice = Math.floor(Math.random() * 200) + 30; // 30 to 230
          const discountPercent = Math.floor(Math.random() * 30) + 5; // 5% to 35%
          const discountedPrice = Math.floor(basePrice * (1 - (discountPercent/100)));
          
          // Clean the name for the loremflickr search query (remove parentheses and spaces)
          let searchQuery = name.replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-zA-Z0-9\s]/g, '').trim().split(' ').join(',');
          
          // Pull exact image for this product
          const img1 = `https://loremflickr.com/600/600/${searchQuery}?lock=${skuCounter}`;
          const img2 = `https://loremflickr.com/600/600/${searchQuery}?lock=${skuCounter + 10000}`;

          const product = {
            name: name,
            sku: sku,
            categories: [categoryName],
            subcategory: subcategory,
            subcategories: [subcategory],
            brandName: "GreenGrocc Select",
            price: basePrice,
            discountedPrice: discountedPrice,
            discountedPercent: discountPercent,
            stock: Math.floor(Math.random() * 300) + 20,
            inStock: true,
            ratings: parseFloat((Math.random() * (5.0 - 4.0) + 4.0).toFixed(1)),
            productImages: [img1, img2],
            description: `Experience the finest quality ${name}. Guaranteed freshness and premium quality directly sourced and packed for your convenience.`,
            features: ["Premium Quality", "100% Authentic", "Carefully Packed"],
            section: categoryData.section,
            storeType: categoryData.storeType,
            isActive: true,
            hotSelling: Math.random() > 0.8,
            justArrived: Math.random() > 0.8,
          };

          if (categoryName === "Vegetables" || categoryName === "Fruits" || categoryName === "Organic") {
             product.farmerDetails = {
                name: "Local Certified Farmer",
                location: "Regional Farm",
                cropCycle: "Seasonal",
                agricultureMethod: "Sustainable Farming"
             };
          }

          if (categoryName === "Grains" || categoryName === "Oils") {
             product.bulkPricing = {
                slabs: [
                  { minQuantity: 2, maxQuantity: 4, pricePerUnit: discountedPrice - 5 },
                  { minQuantity: 5, pricePerUnit: discountedPrice - 10 }
                ]
             };
          }

          allProducts.push(product);
        }
      }
    }

    console.log(`Successfully generated ${allProducts.length} unique mock products. Inserting into MongoDB...`);
    
    const BATCH_SIZE = 100;
    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
        const batch = allProducts.slice(i, i + BATCH_SIZE);
        await Product.insertMany(batch);
        console.log(`Inserted batch ${i/BATCH_SIZE + 1} of ${Math.ceil(allProducts.length/BATCH_SIZE)}`);
    }

    console.log(`✅ Successfully seeded ${allProducts.length} distinctly named products into MongoDB!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Massive Seeding failed:", error);
    process.exit(1);
  }
}

runMassiveSeed();
