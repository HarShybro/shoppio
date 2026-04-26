import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { ENV } from "../config/env.js";

const products = [
    {
        name: "Noise Cancelling Wireless Headset",
        description:
            "High-quality over-ear headset with advanced noise isolation, long battery backup, and crystal-clear audio output. Ideal for travel and daily use.",
        price: 2499,
        stock: 45,
        category: "Electronics",
        images: [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500",
        ],
        averageRating: 4.4,
        totalReviews: 140,
    },
    {
        name: "Smart Fitness Watch X",
        description:
            "Feature-packed smartwatch with heart rate tracking, GPS support, and water resistance.",
        price: 1999,
        stock: 30,
        category: "Electronics",
        images: [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
            "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500",
        ],
        averageRating: 4.6,
        totalReviews: 210,
    },
    {
        name: "Premium Leather Sling Bag",
        description:
            "Elegant leather sling bag with adjustable strap and spacious compartments.",
        price: 1299,
        stock: 20,
        category: "Fashion",
        images: [
            "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500",
            "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500",
        ],
        averageRating: 4.2,
        totalReviews: 75,
    },
    {
        name: "Performance Running Sneakers",
        description:
            "Comfortable running shoes with breathable material and shock absorption.",
        price: 1999,
        stock: 55,
        category: "Sports",
        images: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
            "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500",
        ],
        averageRating: 4.5,
        totalReviews: 300,
    },
    {
        name: "Thriller Fiction Bestseller",
        description:
            "A suspense-filled novel with engaging storytelling and unexpected twists.",
        price: 299,
        stock: 120,
        category: "Books",
        images: [
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500",
        ],
        averageRating: 4.7,
        totalReviews: 1100,
    },
    {
        name: "Portable Wireless Speaker Pro",
        description:
            "Compact Bluetooth speaker with strong sound and durable build.",
        price: 1499,
        stock: 40,
        category: "Electronics",
        images: [
            "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
            "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=500",
        ],
        averageRating: 4.3,
        totalReviews: 150,
    },
    {
        name: "Vintage Denim Jacket",
        description:
            "Classic denim jacket with stylish look and comfortable fit.",
        price: 1999,
        stock: 35,
        category: "Fashion",
        images: [
            "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
            "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500",
        ],
        averageRating: 4.1,
        totalReviews: 88,
    },
    {
        name: "Eco-Friendly Yoga Mat",
        description:
            "Durable non-slip yoga mat with excellent grip and cushioning.",
        price: 799,
        stock: 80,
        category: "Sports",
        images: [
            "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500",
            "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500",
        ],
        averageRating: 4.4,
        totalReviews: 180,
    },
    {
        name: "RGB Mechanical Gaming Keyboard",
        description:
            "Gaming keyboard with RGB lighting and responsive mechanical keys.",
        price: 2499,
        stock: 28,
        category: "Electronics",
        images: [
            "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500",
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
        ],
        averageRating: 4.6,
        totalReviews: 390,
    },
    {
        name: "Modern Design Coffee Table Book",
        description:
            "Beautiful hardcover book showcasing modern architecture and design.",
        price: 699,
        stock: 60,
        category: "Books",
        images: [
            "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500",
            "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500",
        ],
        averageRating: 4.5,
        totalReviews: 120,
    },
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(ENV.DB_URL);
        console.log("✅ Connected to MongoDB");

        // Clear existing products
        await Product.deleteMany({});
        console.log("🗑️  Cleared existing products");

        // Insert seed products
        await Product.insertMany(products);
        console.log(`✅ Successfully seeded ${products.length} products`);

        // Display summary
        const categories = [...new Set(products.map((p) => p.category))];
        console.log("\n📊 Seeded Products Summary:");
        console.log(`Total Products: ${products.length}`);
        console.log(`Categories: ${categories.join(", ")}`);

        // Close connection
        await mongoose.connection.close();
        console.log("\n✅ Database seeding completed and connection closed");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
};

// Run the seed function
seedDatabase();