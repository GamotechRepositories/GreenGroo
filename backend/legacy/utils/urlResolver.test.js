import { resolveImageUrl, resolveImageArray } from "./urlResolver.js";

// Mock process.env
process.env.CLOUDFRONT_DOMAIN = "d1347kdapa3s7q.cloudfront.net";

function testResolveImageUrl() {
  const tests = [
    { input: "images/product/123.jpg", expected: "https://d1347kdapa3s7q.cloudfront.net/images/product/123.jpg" },
    { input: "/images/product/123.jpg", expected: "https://d1347kdapa3s7q.cloudfront.net/images/product/123.jpg" },
    { input: "https://greengrocc-s3.s3.ap-south-1.amazonaws.com/images/product/123.jpg", expected: "https://d1347kdapa3s7q.cloudfront.net/images/product/123.jpg" },
    { input: "http://greengrocc-s3.s3.ap-south-1.amazonaws.com/images/product/123.jpg", expected: "https://d1347kdapa3s7q.cloudfront.net/images/product/123.jpg" },
    { input: "https://d1347kdapa3s7q.cloudfront.net/images/product/123.jpg", expected: "https://d1347kdapa3s7q.cloudfront.net/images/product/123.jpg" },
    { input: null, expected: null },
    { input: "", expected: null }
  ];

  let passed = true;
  tests.forEach((t, i) => {
    const actual = resolveImageUrl(t.input);
    if (actual !== t.expected) {
      console.error(`Test ${i} failed: input ${t.input}, expected ${t.expected}, got ${actual}`);
      passed = false;
    }
  });

  if (passed) {
    console.log("All resolveImageUrl tests passed.");
  }
}

function testResolveImageArray() {
    const input = ["images/1.jpg", "https://greengrocc-s3.s3.ap-south-1.amazonaws.com/images/2.jpg", null, ""];
    const expected = [
        "https://d1347kdapa3s7q.cloudfront.net/images/1.jpg",
        "https://d1347kdapa3s7q.cloudfront.net/images/2.jpg"
    ];
    
    const actual = resolveImageArray(input);
    let passed = JSON.stringify(actual) === JSON.stringify(expected);
    if (!passed) {
        console.error(`testResolveImageArray failed: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    } else {
        console.log("All resolveImageArray tests passed.");
    }
}

testResolveImageUrl();
testResolveImageArray();
