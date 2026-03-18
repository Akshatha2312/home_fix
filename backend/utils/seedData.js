import mongoose from "mongoose";
import dns from "dns";
import dotenv from "dotenv";
import Customer from "../models/customer.model.js";
import Provider from "../models/provider.model.js";

dotenv.config();

// Force IPv4 and use Google DNS to resolve MongoDB Atlas SRV records
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const providers = [
  {
    name: "Rajesh Kumar",
    email: "rajesh@homefix.demo",
    phone: "9876543201",
    serviceType: "plumber",
    experience: 8,
    rating: 4.8,
    totalBookings: 156,
    pricePerHour: 500,
    area: "Koramangala",
    pincode: "560034",
    description:
      "Expert plumber with 8+ years experience. Specializing in pipe repair, leak fixing, and bathroom fitting installations.",
    skills: [
      "Pipe Repair",
      "Leak Fixing",
      "Bathroom Fitting",
      "Water Heater Installation",
    ],
  },
  {
    name: "Suresh Babu",
    email: "suresh@homefix.demo",
    phone: "9876543202",
    serviceType: "plumber",
    experience: 12,
    rating: 4.9,
    totalBookings: 210,
    pricePerHour: 600,
    area: "Indiranagar",
    pincode: "560038",
    description:
      "Master plumber specializing in complete bathroom renovations and complex pipeline systems.",
    skills: [
      "Pipeline Systems",
      "Bathroom Renovation",
      "Drain Cleaning",
      "Fixture Installation",
    ],
  },
  {
    name: "Manjunath R",
    email: "manju@homefix.demo",
    phone: "9876543203",
    serviceType: "plumber",
    experience: 5,
    rating: 4.5,
    totalBookings: 89,
    pricePerHour: 400,
    area: "HSR Layout",
    pincode: "560102",
    description:
      "Reliable plumber for all types of plumbing needs. Quick response and quality work.",
    skills: [
      "General Plumbing",
      "Tap Repair",
      "Toilet Repair",
      "Kitchen Plumbing",
    ],
  },
  {
    name: "Ravi Shankar",
    email: "ravi@homefix.demo",
    phone: "9876543204",
    serviceType: "plumber",
    experience: 6,
    rating: 4.6,
    totalBookings: 102,
    pricePerHour: 450,
    area: "Whitefield",
    pincode: "560066",
    description:
      "Professional plumber offering affordable and timely services in the Whitefield area.",
    skills: [
      "Water Tank Repair",
      "Pipe Fitting",
      "Drainage",
      "Motor Pump Service",
    ],
  },

  {
    name: "Venkatesh Iyer",
    email: "venkat@homefix.demo",
    phone: "9876543205",
    serviceType: "electrician",
    experience: 10,
    rating: 4.7,
    totalBookings: 180,
    pricePerHour: 550,
    area: "Jayanagar",
    pincode: "560041",
    description:
      "Certified electrician with expertise in residential and commercial electrical work.",
    skills: [
      "Wiring",
      "Switch Board Repair",
      "MCB Installation",
      "Fan Installation",
    ],
  },
  {
    name: "Kiran Reddy",
    email: "kiran@homefix.demo",
    phone: "9876543206",
    serviceType: "electrician",
    experience: 7,
    rating: 4.8,
    totalBookings: 145,
    pricePerHour: 500,
    area: "BTM Layout",
    pincode: "560076",
    description:
      "Expert in smart home electrical setups and modern wiring solutions.",
    skills: [
      "Smart Home Wiring",
      "LED Installation",
      "Inverter Setup",
      "Earthing",
    ],
  },
  {
    name: "Prakash Rao",
    email: "prakash@homefix.demo",
    phone: "9876543207",
    serviceType: "electrician",
    experience: 15,
    rating: 4.9,
    totalBookings: 320,
    pricePerHour: 700,
    area: "MG Road",
    pincode: "560001",
    description:
      "Master electrician with 15+ years. Specialist in industrial and commercial electrical solutions.",
    skills: [
      "Industrial Wiring",
      "Generator Setup",
      "UPS Installation",
      "Electrical Panel",
    ],
  },
  {
    name: "Anand Kumar",
    email: "anand@homefix.demo",
    phone: "9876543208",
    serviceType: "electrician",
    experience: 4,
    rating: 4.4,
    totalBookings: 67,
    pricePerHour: 400,
    area: "Electronic City",
    pincode: "560100",
    description:
      "Young electrician with strong technical knowledge. Affordable rates for all basic needs.",
    skills: [
      "Appliance Repair",
      "Socket Installation",
      "Light Fixture",
      "CCTV Installation",
    ],
  },

  {
    name: "Arjun Das",
    email: "arjun@homefix.demo",
    phone: "9876543209",
    serviceType: "painter",
    experience: 9,
    rating: 4.6,
    totalBookings: 120,
    pricePerHour: 450,
    area: "Marathahalli",
    pincode: "560037",
    description:
      "Professional painter specializing in interior and exterior painting with premium finish.",
    skills: [
      "Interior Painting",
      "Exterior Painting",
      "Texture Painting",
      "Wood Polish",
    ],
  },
  {
    name: "Deepak Singh",
    email: "deepak@homefix.demo",
    phone: "9876543210",
    serviceType: "painter",
    experience: 11,
    rating: 4.7,
    totalBookings: 175,
    pricePerHour: 550,
    area: "Sarjapur Road",
    pincode: "560035",
    description:
      "Creative painter specializing in artistic walls, stencil work, and designer finishes.",
    skills: [
      "Artistic Walls",
      "Stencil Work",
      "PU Finish",
      "Wallpaper Installation",
    ],
  },
  {
    name: "Mohammed Ismail",
    email: "ismail@homefix.demo",
    phone: "9876543211",
    serviceType: "painter",
    experience: 6,
    rating: 4.5,
    totalBookings: 95,
    pricePerHour: 400,
    area: "JP Nagar",
    pincode: "560078",
    description:
      "Reliable painter offering quality painting services at competitive prices.",
    skills: ["Emulsion Paint", "Distemper", "Primer Coating", "Wall Putty"],
  },
  {
    name: "Srinivas Murthy",
    email: "srinivas@homefix.demo",
    phone: "9876543212",
    serviceType: "painter",
    experience: 14,
    rating: 4.8,
    totalBookings: 250,
    pricePerHour: 650,
    area: "Hebbal",
    pincode: "560024",
    description:
      "Expert painter with mastery over decorative finishes, epoxy coatings's and luxury painting.",
    skills: [
      "Epoxy Coating",
      "Decorative Finish",
      "Water Proofing",
      "Spray Painting",
    ],
  },

  {
    name: "Gopal Krishna",
    email: "gopal@homefix.demo",
    phone: "9876543213",
    serviceType: "mason",
    experience: 20,
    rating: 4.9,
    totalBookings: 340,
    pricePerHour: 700,
    area: "Basavanagudi",
    pincode: "560004",
    description:
      "Master mason with 20 years of experience in residential construction and renovation.",
    skills: ["Brick Work", "Plastering", "Tile Setting", "Concrete Work"],
  },
  {
    name: "Nagaraj M",
    email: "nagaraj@homefix.demo",
    phone: "9876543214",
    serviceType: "mason",
    experience: 10,
    rating: 4.6,
    totalBookings: 130,
    pricePerHour: 550,
    area: "Rajajinagar",
    pincode: "560010",
    description:
      "Experienced mason specializing in kitchen and bathroom renovations.",
    skills: [
      "Kitchen Renovation",
      "Bathroom Renovation",
      "Waterproofing",
      "Foundation Work",
    ],
  },
  {
    name: "Basavaraj T",
    email: "basavaraj@homefix.demo",
    phone: "9876543215",
    serviceType: "mason",
    experience: 7,
    rating: 4.5,
    totalBookings: 88,
    pricePerHour: 450,
    area: "Yelahanka",
    pincode: "560064",
    description: "Skilled mason for all types of construction and repair work.",
    skills: ["Wall Construction", "Tiling", "Stone Work", "Renovation"],
  },
  {
    name: "Ramesh Naidu",
    email: "rameshN@homefix.demo",
    phone: "9876543216",
    serviceType: "mason",
    experience: 13,
    rating: 4.7,
    totalBookings: 195,
    pricePerHour: 600,
    area: "Bannerghatta Road",
    pincode: "560076",
    description:
      "Expert in modern construction techniques and luxury interiors.",
    skills: [
      "Modern Construction",
      "Marble Work",
      "Granite Setting",
      "Interior Design",
    ],
  },

  {
    name: "Priya Sharma",
    email: "priya@homefix.demo",
    phone: "9876543217",
    serviceType: "cleaner",
    experience: 5,
    rating: 4.7,
    totalBookings: 200,
    pricePerHour: 350,
    area: "Koramangala",
    pincode: "560034",
    description:
      "Professional cleaner specializing in deep cleaning and move-in/move-out cleaning services.",
    skills: [
      "Deep Cleaning",
      "Kitchen Cleaning",
      "Bathroom Sanitization",
      "Move-in Cleaning",
    ],
  },
  {
    name: "Lakshmi Devi",
    email: "lakshmi@homefix.demo",
    phone: "9876543218",
    serviceType: "cleaner",
    experience: 8,
    rating: 4.8,
    totalBookings: 280,
    pricePerHour: 400,
    area: "Indiranagar",
    pincode: "560038",
    description:
      "Expert in eco-friendly cleaning methods. Uses organic and safe cleaning products.",
    skills: [
      "Eco Cleaning",
      "Sofa Cleaning",
      "Carpet Cleaning",
      "Window Cleaning",
    ],
  },
  {
    name: "Kavitha R",
    email: "kavitha@homefix.demo",
    phone: "9876543219",
    serviceType: "cleaner",
    experience: 3,
    rating: 4.4,
    totalBookings: 60,
    pricePerHour: 300,
    area: "Whitefield",
    pincode: "560066",
    description: "Reliable and thorough cleaning services at affordable rates.",
    skills: ["Regular Cleaning", "Dusting", "Mopping", "Pest Control"],
  },
  {
    name: "Sunita M",
    email: "sunita@homefix.demo",
    phone: "9876543220",
    serviceType: "cleaner",
    experience: 6,
    rating: 4.6,
    totalBookings: 150,
    pricePerHour: 350,
    area: "HSR Layout",
    pincode: "560102",
    description:
      "Thorough cleaning professional with attention to detail and customer satisfaction.",
    skills: [
      "Office Cleaning",
      "Post-Construction",
      "Mattress Cleaning",
      "Sanitization",
    ],
  },

  {
    name: "Mahesh Kumar",
    email: "mahesh@homefix.demo",
    phone: "9876543221",
    serviceType: "carpenter",
    experience: 12,
    rating: 4.8,
    totalBookings: 220,
    pricePerHour: 550,
    area: "Jayanagar",
    pincode: "560041",
    description:
      "Master carpenter specializing in custom furniture and modular kitchen installations.",
    skills: [
      "Custom Furniture",
      "Modular Kitchen",
      "Wardrobe Design",
      "Door Installation",
    ],
  },
  {
    name: "Raju Shetty",
    email: "raju@homefix.demo",
    phone: "9876543222",
    serviceType: "carpenter",
    experience: 8,
    rating: 4.6,
    totalBookings: 140,
    pricePerHour: 500,
    area: "BTM Layout",
    pincode: "560076",
    description:
      "Skilled carpenter for furniture repair, assembly, and wood polishing.",
    skills: [
      "Furniture Repair",
      "Wood Polish",
      "Cabinet Making",
      "Bed Assembly",
    ],
  },
  {
    name: "Vishnu Prasad",
    email: "vishnu@homefix.demo",
    phone: "9876543223",
    serviceType: "carpenter",
    experience: 15,
    rating: 4.9,
    totalBookings: 300,
    pricePerHour: 700,
    area: "MG Road",
    pincode: "560001",
    description:
      "Premium carpenter specializing in luxury wood interiors and designer furniture.",
    skills: [
      "Luxury Interiors",
      "Teak Furniture",
      "Wood Carving",
      "Partition Work",
    ],
  },
  {
    name: "Santosh V",
    email: "santosh@homefix.demo",
    phone: "9876543224",
    serviceType: "carpenter",
    experience: 5,
    rating: 4.5,
    totalBookings: 75,
    pricePerHour: 400,
    area: "Electronic City",
    pincode: "560100",
    description:
      "Affordable carpenter for everyday furniture needs and quick repairs.",
    skills: [
      "Quick Repairs",
      "Shelf Installation",
      "Lock Fitting",
      "Handle Replacement",
    ],
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log("Connected to MongoDB for seeding...");

    // Clear existing demo data
    await Customer.deleteMany({ email: { $regex: "@homefix.demo" } });
    await Provider.deleteMany({ email: { $regex: "@homefix.demo" } });
    console.log("Cleared existing demo users");

    for (const p of providers) {
      // Create provider directly
      await Provider.create({
        name: p.name,
        email: p.email,
        password: "demo123456",
        phone: p.phone,
        userType: "provider",
        isVerified: true,
        serviceType: p.serviceType,
        experience: p.experience,
        rating: p.rating,
        totalBookings: p.totalBookings,
        totalReviews: Math.floor(p.totalBookings * 0.6),
        pricePerHour: p.pricePerHour,
        availability: false,
        description: p.description,
        skills: p.skills,
        location: {
          area: p.area,
          city: "Bangalore",
          pincode: p.pincode,
        },
      });

      console.log(`✅ Created provider: ${p.name}`);
    }

    // Create demo customer
    await Customer.create({
      name: "Priya Menon",
      email: "customer@homefix.demo",
      password: "demo123456",
      phone: "9876500000",
      userType: "customer",
      isVerified: true,
    });
    console.log("✅ Created demo customer: Priya Menon");

    console.log(
      `\n🎉 Seeding complete! ${providers.length} providers + 1 customer created.`,
    );
    console.log("\n📧 Demo Credentials:");
    console.log("  Customer: customer@homefix.demo / demo123456");
    console.log("  Provider: rajesh@homefix.demo / demo123456");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedDatabase();
