import type { ProductCategory } from './types';

export const DEFAULT_HOUSE_IMAGE_URL = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop";

export const SIDING_OPTIONS: ProductCategory[] = [
  {
    label: "Siding Styles",
    options: [
      {
        value: "Gray Cedar Shake Siding",
        label: "Gray Cedar Shake",
        colors: ["Light Gray", "Stormy Gray", "Charcoal"],
        imageUrl: "https://images.thdstatic.com/productImages/a93a32c0-a5cf-4f7f-b673-690252554d6d/svn/light-gray-certainteed-vinyl-siding-520101-64_1000.jpg"
      },
      {
        value: "Beige Horizontal Siding",
        label: "Beige Horizontal",
        colors: ["Beige", "Tan", "Khaki"],
        imageUrl: "https://images.thdstatic.com/productImages/91993b8e-3d0b-48a0-9a3d-2f08518814a8/svn/savannah-wicker-royal-building-products-vinyl-siding-1120010-64_1000.jpg"
      },
    ]
  }
];

export const TRIM_OPTIONS: ProductCategory[] = [
    {
        label: "Trim Boards",
        options: [
            {
                value: "Classic White Trim",
                label: "Classic White",
                colors: ["White"],
                imageUrl: "https://images.thdstatic.com/productImages/c35a643c-39e2-45e0-8186-455b9514f762/svn/arctic-white-james-hardie-pvc-boards-210511-64_1000.jpg"
            },
            {
                value: "Modern Black Trim",
                label: "Modern Black",
                colors: ["Black"],
                imageUrl: "https://images.thdstatic.com/productImages/71a85b67-548c-443e-a698-2a7813a4010b/svn/black-james-hardie-pvc-boards-210561-64_1000.jpg"
            }
        ]
    }
];

export const DOOR_OPTIONS: ProductCategory[] = [
    {
        label: "Front Doors",
        options: [
            {
                value: "Craftsman Style Blue Door",
                label: "Craftsman Blue",
                colors: ["Navy Blue", "Deep Ocean", "Royal Blue"],
                imageUrl: "https://images.thdstatic.com/productImages/a74092dd-1135-4537-a279-847ba8495a63/svn/deep-ocean-mmi-door-doors-with-glass-z029851l-64_1000.jpg"
            },
            {
                value: "Craftsman Style Oak Door",
                label: "Craftsman Oak",
                colors: ["Natural Oak", "Walnut Stain", "Golden Pecan"],
                imageUrl: "https://images.thdstatic.com/productImages/2775a20d-0343-43c9-93e1-38c6428c069b/svn/walnut-stain-jeld-wen-doors-with-glass-a1310-a1232-64_1000.jpg"
            }
        ]
    }
];

export const ROOFING_OPTIONS: ProductCategory[] = [
  {
    label: "Asphalt Shingles",
    options: [
      {
        value: "Onyx Black Asphalt Shingles",
        label: "Onyx Black",
        colors: ["Onyx Black", "Charcoal"],
        imageUrl: "https://images.thdstatic.com/productImages/d3369a4c-a192-4af3-94c6-8a9c80d416f4/svn/onyx-black-owens-corning-roofing-shingles-td01-64_1000.jpg"
      },
      {
        value: "Weathered Wood Asphalt Shingles",
        label: "Weathered Wood",
        colors: ["Weathered Wood", "Driftwood"],
        imageUrl: "https://images.thdstatic.com/productImages/f422b442-4f3b-486a-a1b7-1f488e1c640e/svn/weathered-wood-owens-corning-roofing-shingles-de04-64_1000.jpg"
      },
       {
        value: "Desert Tan Asphalt Shingles",
        label: "Desert Tan",
        colors: ["Desert Tan", "Shakewood"],
        imageUrl: "https://images.thdstatic.com/productImages/fd23e980-b747-4137-9759-191060e227a9/svn/shakewood-gaf-roofing-shingles-0600300-64_1000.jpg"
      },
      {
        value: "Pewter Gray Asphalt Shingles",
        label: "Pewter Gray",
        colors: ["Pewter Gray", "Colonial Slate"],
        imageUrl: "https://images.thdstatic.com/productImages/394c86a5-3342-491c-813c-1b77626c8b32/svn/pewter-gray-gaf-roofing-shingles-0600700-64_1000.jpg"
      },
      {
        value: "Autumn Blend Asphalt Shingles",
        label: "Autumn Blend",
        colors: ["Mission Brown", "Barkwood"],
        imageUrl: "https://images.thdstatic.com/productImages/be2a563f-14a0-452f-b44f-12c87b923c8a/svn/mission-brown-iko-roofing-shingles-010-8025-64_1000.jpg"
      }
    ]
  },
  {
    label: "Tile Roofing",
    options: [
      {
        value: "Terracotta Spanish Tile Roofing",
        label: "Terracotta Spanish Tile",
        colors: ["Terracotta", "Adobe Red", "Spanish Clay"],
        imageUrl: "https://images.thdstatic.com/productImages/d63e52f4-813c-4a94-817e-3a78b5de3823/svn/terracotta-bca-roof-tiles-s-tile-terracotta-64_1000.jpg"
      }
    ]
  }
];