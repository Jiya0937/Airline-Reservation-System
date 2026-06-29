export const mockFlights = [
  {
    id: 1,
    airline: "FlyEasy Airways",
    logo: "FE",
    flightNumber: "FE-201",
    aircraft: "Airbus A350-900",
    from: "Delhi (DEL)",
    to: "Mumbai (BOM)",
    departureTime: "06:00",
    arrivalTime: "08:15",
    duration: "2h 15m",
    stops: 0,
    refundable: true,
    tags: ["Best Value", "Cheapest"],
    fares: {
      "Economy": { originalPrice: 6500, discountedPrice: 4999 },
      "Premium Economy": { originalPrice: 9000, discountedPrice: 7200 },
      "Business Class": { originalPrice: 18000, discountedPrice: 14500 }
    }
  },
  {
    id: 2,
    airline: "IndiGo",
    logo: "6E",
    flightNumber: "6E-512",
    aircraft: "Airbus A320neo",
    from: "Delhi (DEL)",
    to: "Mumbai (BOM)",
    departureTime: "07:30",
    arrivalTime: "09:45",
    duration: "2h 15m",
    stops: 0,
    refundable: false,
    tags: ["Cheapest"],
    fares: {
      "Economy": { originalPrice: 5800, discountedPrice: 4500 },
      "Premium Economy": { originalPrice: 8000, discountedPrice: 6500 },
      "Business Class": { originalPrice: 16000, discountedPrice: 13000 }
    }
  },
  {
    id: 3,
    airline: "Air India",
    logo: "AI",
    flightNumber: "AI-805",
    aircraft: "Boeing 787-8 Dreamliner",
    from: "Delhi (DEL)",
    to: "Mumbai (BOM)",
    departureTime: "10:00",
    arrivalTime: "12:15",
    duration: "2h 15m",
    stops: 0,
    refundable: true,
    tags: ["Best Value"],
    fares: {
      "Economy": { originalPrice: 7200, discountedPrice: 5500 },
      "Premium Economy": { originalPrice: 10000, discountedPrice: 8000 },
      "Business Class": { originalPrice: 22000, discountedPrice: 17500 }
    }
  },
  {
    id: 4,
    airline: "Vistara",
    logo: "UK",
    flightNumber: "UK-985",
    aircraft: "Boeing 787-9",
    from: "Delhi (DEL)",
    to: "Mumbai (BOM)",
    departureTime: "15:45",
    arrivalTime: "18:00",
    duration: "2h 15m",
    stops: 0,
    refundable: true,
    tags: ["Fastest"],
    fares: {
      "Economy": { originalPrice: 8500, discountedPrice: 6800 },
      "Premium Economy": { originalPrice: 12000, discountedPrice: 9500 },
      "Business Class": { originalPrice: 25000, discountedPrice: 20000 }
    }
  },
  {
    id: 5,
    airline: "Emirates",
    logo: "EK",
    flightNumber: "EK-506",
    aircraft: "Boeing 777-300ER",
    from: "Delhi (DEL)",
    to: "Mumbai (BOM)",
    departureTime: "21:30",
    arrivalTime: "23:55",
    duration: "2h 25m",
    stops: 0,
    refundable: true,
    tags: ["Best Value"],
    fares: {
      "Economy": { originalPrice: 14000, discountedPrice: 11200 },
      "Premium Economy": { originalPrice: 21000, discountedPrice: 16800 },
      "Business Class": { originalPrice: 48000, discountedPrice: 38400 }
    }
  },
  {
    id: 6,
    airline: "FlyEasy Airways",
    logo: "FE",
    flightNumber: "FE-205",
    aircraft: "Airbus A350-900",
    from: "Delhi (DEL)",
    to: "Mumbai (BOM)",
    departureTime: "13:00",
    arrivalTime: "17:30",
    duration: "4h 30m",
    stops: 1,
    refundable: true,
    tags: [],
    fares: {
      "Economy": { originalPrice: 6200, discountedPrice: 4600 },
      "Premium Economy": { originalPrice: 8500, discountedPrice: 6800 },
      "Business Class": { originalPrice: 17000, discountedPrice: 13600 }
    }
  }
];
