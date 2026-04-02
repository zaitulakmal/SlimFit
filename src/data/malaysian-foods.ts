export interface LocalFood {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingQty: number;
  servingUnit: string;
  category: string;
}

export const MALAYSIAN_FOODS: LocalFood[] = [
  // Rice dishes
  { id: 'my-001', name: 'Nasi Lemak', calories: 389, proteinG: 13, carbsG: 55, fatG: 14, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  { id: 'my-002', name: 'Nasi Goreng', calories: 450, proteinG: 14, carbsG: 64, fatG: 16, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  { id: 'my-003', name: 'Nasi Campur', calories: 520, proteinG: 22, carbsG: 70, fatG: 18, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  { id: 'my-004', name: 'Nasi Kandar', calories: 580, proteinG: 28, carbsG: 68, fatG: 22, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  { id: 'my-005', name: 'Nasi Biryani', calories: 530, proteinG: 20, carbsG: 75, fatG: 17, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  { id: 'my-006', name: 'Nasi Putih', calories: 242, proteinG: 5, carbsG: 53, fatG: 0.5, servingQty: 1, servingUnit: 'cup', category: 'rice' },
  { id: 'my-007', name: 'Nasi Tomato', calories: 380, proteinG: 8, carbsG: 70, fatG: 8, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  { id: 'my-008', name: 'Nasi Ayam', calories: 490, proteinG: 26, carbsG: 68, fatG: 14, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  // Noodles
  { id: 'my-010', name: 'Mee Goreng', calories: 430, proteinG: 13, carbsG: 60, fatG: 15, servingQty: 1, servingUnit: 'plate', category: 'noodles' },
  { id: 'my-011', name: 'Char Kway Teow', calories: 570, proteinG: 18, carbsG: 70, fatG: 22, servingQty: 1, servingUnit: 'plate', category: 'noodles' },
  { id: 'my-012', name: 'Laksa Lemak', calories: 460, proteinG: 18, carbsG: 55, fatG: 20, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-013', name: 'Asam Laksa', calories: 340, proteinG: 16, carbsG: 52, fatG: 7, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-014', name: 'Wantan Mee', calories: 380, proteinG: 14, carbsG: 60, fatG: 10, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-015', name: 'Mee Rebus', calories: 400, proteinG: 14, carbsG: 62, fatG: 10, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-016', name: 'Mee Siam', calories: 350, proteinG: 12, carbsG: 55, fatG: 9, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-017', name: 'Kuey Teow Soup', calories: 290, proteinG: 12, carbsG: 48, fatG: 6, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-018', name: 'Pan Mee', calories: 420, proteinG: 16, carbsG: 58, fatG: 14, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-019', name: 'Bak Kut Teh', calories: 320, proteinG: 28, carbsG: 10, fatG: 18, servingQty: 1, servingUnit: 'bowl', category: 'soup' },
  // Bread / Roti
  { id: 'my-020', name: 'Roti Canai', calories: 301, proteinG: 7, carbsG: 45, fatG: 10, servingQty: 1, servingUnit: 'piece', category: 'bread' },
  { id: 'my-021', name: 'Roti Canai dengan Dal', calories: 370, proteinG: 12, carbsG: 55, fatG: 12, servingQty: 1, servingUnit: 'serving', category: 'bread' },
  { id: 'my-022', name: 'Capati', calories: 210, proteinG: 5, carbsG: 35, fatG: 6, servingQty: 1, servingUnit: 'piece', category: 'bread' },
  { id: 'my-023', name: 'Puri', calories: 130, proteinG: 3, carbsG: 18, fatG: 5, servingQty: 1, servingUnit: 'piece', category: 'bread' },
  { id: 'my-024', name: 'Tosai', calories: 180, proteinG: 5, carbsG: 32, fatG: 4, servingQty: 1, servingUnit: 'piece', category: 'bread' },
  { id: 'my-025', name: 'Roti Bakar', calories: 220, proteinG: 6, carbsG: 34, fatG: 7, servingQty: 2, servingUnit: 'slices', category: 'bread' },
  { id: 'my-026', name: 'Roti Telur', calories: 380, proteinG: 10, carbsG: 50, fatG: 15, servingQty: 1, servingUnit: 'piece', category: 'bread' },
  // Proteins
  { id: 'my-030', name: 'Ayam Goreng', calories: 320, proteinG: 35, carbsG: 10, fatG: 16, servingQty: 1, servingUnit: 'piece', category: 'protein' },
  { id: 'my-031', name: 'Rendang Daging', calories: 380, proteinG: 30, carbsG: 8, fatG: 24, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-032', name: 'Satay (5 cucuk)', calories: 300, proteinG: 28, carbsG: 18, fatG: 12, servingQty: 5, servingUnit: 'sticks', category: 'protein' },
  { id: 'my-033', name: 'Ikan Goreng', calories: 230, proteinG: 30, carbsG: 5, fatG: 10, servingQty: 1, servingUnit: 'piece', category: 'protein' },
  { id: 'my-034', name: 'Ikan Bakar', calories: 190, proteinG: 28, carbsG: 2, fatG: 7, servingQty: 1, servingUnit: 'piece', category: 'protein' },
  { id: 'my-035', name: 'Udang Goreng Tepung', calories: 280, proteinG: 18, carbsG: 22, fatG: 12, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-036', name: 'Daging Masak Merah', calories: 350, proteinG: 28, carbsG: 10, fatG: 20, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-037', name: 'Ayam Masak Merah', calories: 310, proteinG: 32, carbsG: 8, fatG: 16, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-038', name: 'Tahu Goreng', calories: 210, proteinG: 14, carbsG: 8, fatG: 14, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-039', name: 'Tempe Goreng', calories: 200, proteinG: 12, carbsG: 14, fatG: 10, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  // Vegetables / Sides
  { id: 'my-040', name: 'Kangkung Belacan', calories: 120, proteinG: 4, carbsG: 10, fatG: 7, servingQty: 1, servingUnit: 'serving', category: 'vegetable' },
  { id: 'my-041', name: 'Sayur Campur', calories: 90, proteinG: 4, carbsG: 12, fatG: 3, servingQty: 1, servingUnit: 'serving', category: 'vegetable' },
  { id: 'my-042', name: 'Acar', calories: 80, proteinG: 2, carbsG: 14, fatG: 2, servingQty: 1, servingUnit: 'serving', category: 'vegetable' },
  { id: 'my-043', name: 'Ulam-ulaman', calories: 50, proteinG: 3, carbsG: 8, fatG: 1, servingQty: 1, servingUnit: 'serving', category: 'vegetable' },
  // Snacks / Kuih
  { id: 'my-050', name: 'Karipap', calories: 190, proteinG: 5, carbsG: 24, fatG: 8, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-051', name: 'Cucur Udang', calories: 150, proteinG: 5, carbsG: 18, fatG: 7, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-052', name: 'Kuih Lapis', calories: 130, proteinG: 2, carbsG: 26, fatG: 2, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-053', name: 'Kuih Keria', calories: 160, proteinG: 2, carbsG: 30, fatG: 4, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-054', name: 'Pisang Goreng', calories: 180, proteinG: 2, carbsG: 30, fatG: 6, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-055', name: 'Pau Ayam', calories: 220, proteinG: 8, carbsG: 32, fatG: 7, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-056', name: 'Popiah Basah', calories: 170, proteinG: 6, carbsG: 28, fatG: 5, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-057', name: 'Kuih Seri Muka', calories: 145, proteinG: 3, carbsG: 28, fatG: 3, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  // Desserts
  { id: 'my-060', name: 'Cendol', calories: 280, proteinG: 3, carbsG: 56, fatG: 6, servingQty: 1, servingUnit: 'bowl', category: 'dessert' },
  { id: 'my-061', name: 'Ais Kacang', calories: 350, proteinG: 6, carbsG: 72, fatG: 5, servingQty: 1, servingUnit: 'bowl', category: 'dessert' },
  { id: 'my-062', name: 'Bubur Kacang', calories: 220, proteinG: 6, carbsG: 40, fatG: 5, servingQty: 1, servingUnit: 'bowl', category: 'dessert' },
  // Beverages
  { id: 'my-070', name: 'Teh Tarik', calories: 130, proteinG: 4, carbsG: 22, fatG: 3, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-071', name: 'Teh O Ais', calories: 80, proteinG: 1, carbsG: 20, fatG: 0, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-072', name: 'Kopi O', calories: 70, proteinG: 1, carbsG: 16, fatG: 0, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-073', name: 'Kopi Tarik', calories: 120, proteinG: 3, carbsG: 20, fatG: 3, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-074', name: 'Milo Ais', calories: 180, proteinG: 5, carbsG: 34, fatG: 3, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-075', name: 'Jus Mangga', calories: 120, proteinG: 1, carbsG: 30, fatG: 0, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-076', name: 'Sirap Bandung', calories: 160, proteinG: 1, carbsG: 38, fatG: 1, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-077', name: 'Air Kosong', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, servingQty: 1, servingUnit: 'glass', category: 'beverage' },
  // Fruits
  { id: 'my-080', name: 'Durian', calories: 357, proteinG: 4, carbsG: 66, fatG: 13, servingQty: 100, servingUnit: 'g', category: 'fruit' },
  { id: 'my-081', name: 'Rambutan', calories: 60, proteinG: 1, carbsG: 16, fatG: 0, servingQty: 5, servingUnit: 'pieces', category: 'fruit' },
  { id: 'my-082', name: 'Mangga', calories: 66, proteinG: 1, carbsG: 17, fatG: 0, servingQty: 1, servingUnit: 'medium', category: 'fruit' },
  { id: 'my-083', name: 'Pisang', calories: 105, proteinG: 1, carbsG: 27, fatG: 0, servingQty: 1, servingUnit: 'medium', category: 'fruit' },
  { id: 'my-084', name: 'Betik (Papaya)', calories: 55, proteinG: 1, carbsG: 14, fatG: 0, servingQty: 1, servingUnit: 'cup', category: 'fruit' },
  { id: 'my-085', name: 'Ciku', calories: 83, proteinG: 1, carbsG: 20, fatG: 1, servingQty: 1, servingUnit: 'medium', category: 'fruit' },
  // Fast food
  { id: 'my-090', name: 'McD Big Mac', calories: 550, proteinG: 26, carbsG: 45, fatG: 30, servingQty: 1, servingUnit: 'burger', category: 'fast_food' },
  { id: 'my-091', name: 'McD Ayam McDeluxe', calories: 490, proteinG: 28, carbsG: 42, fatG: 22, servingQty: 1, servingUnit: 'burger', category: 'fast_food' },
  { id: 'my-092', name: 'KFC Original Chicken', calories: 320, proteinG: 30, carbsG: 14, fatG: 17, servingQty: 1, servingUnit: 'piece', category: 'fast_food' },
  { id: 'my-093', name: 'French Fries (Sederhana)', calories: 320, proteinG: 4, carbsG: 43, fatG: 15, servingQty: 1, servingUnit: 'serving', category: 'fast_food' },
  { id: 'my-094', name: 'McD McFlurry', calories: 340, proteinG: 8, carbsG: 54, fatG: 10, servingQty: 1, servingUnit: 'cup', category: 'fast_food' },
  { id: 'my-095', name: 'KFC Zinger Burger', calories: 450, proteinG: 24, carbsG: 44, fatG: 20, servingQty: 1, servingUnit: 'burger', category: 'fast_food' },
  { id: 'my-096', name: 'Pizza Hut Personal Pan', calories: 620, proteinG: 28, carbsG: 72, fatG: 24, servingQty: 1, servingUnit: 'pizza', category: 'fast_food' },
  { id: 'my-097', name: 'Ramly Burger', calories: 480, proteinG: 22, carbsG: 42, fatG: 24, servingQty: 1, servingUnit: 'burger', category: 'fast_food' },
  // Packaged
  { id: 'my-100', name: 'Maggi Mee Goreng', calories: 450, proteinG: 10, carbsG: 62, fatG: 18, servingQty: 1, servingUnit: 'packet', category: 'packaged' },
  { id: 'my-101', name: 'Maggi Mee Sup', calories: 360, proteinG: 9, carbsG: 56, fatG: 12, servingQty: 1, servingUnit: 'packet', category: 'packaged' },
  { id: 'my-102', name: 'Gardenia Bread (2 slices)', calories: 180, proteinG: 6, carbsG: 34, fatG: 2, servingQty: 2, servingUnit: 'slices', category: 'packaged' },
  { id: 'my-103', name: 'Teh Boh Susu (kotak)', calories: 110, proteinG: 3, carbsG: 20, fatG: 2, servingQty: 1, servingUnit: 'box', category: 'packaged' },
  { id: 'my-104', name: 'Milo Kotak 200ml', calories: 110, proteinG: 4, carbsG: 18, fatG: 2, servingQty: 1, servingUnit: 'box', category: 'packaged' },
  { id: 'my-105', name: 'Munchys Oat Krunch', calories: 130, proteinG: 2, carbsG: 20, fatG: 4, servingQty: 4, servingUnit: 'biscuits', category: 'packaged' },
  { id: 'my-106', name: 'Myojo Mee Goreng', calories: 430, proteinG: 9, carbsG: 60, fatG: 17, servingQty: 1, servingUnit: 'packet', category: 'packaged' },
  { id: 'my-107', name: 'Nestle Corn Flakes', calories: 160, proteinG: 3, carbsG: 36, fatG: 0.5, servingQty: 40, servingUnit: 'g', category: 'packaged' },
  { id: 'my-108', name: 'Mamee Monster', calories: 200, proteinG: 4, carbsG: 28, fatG: 8, servingQty: 1, servingUnit: 'packet', category: 'packaged' },
  // More rice dishes
  { id: 'my-110', name: 'Nasi Paprik', calories: 560, proteinG: 25, carbsG: 72, fatG: 18, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  { id: 'my-111', name: 'Nasi Kerabu', calories: 420, proteinG: 16, carbsG: 65, fatG: 12, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  { id: 'my-112', name: 'Nasi Dagang', calories: 480, proteinG: 18, carbsG: 70, fatG: 16, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  { id: 'my-113', name: 'Nasi Minyak', calories: 400, proteinG: 7, carbsG: 75, fatG: 10, servingQty: 1, servingUnit: 'cup', category: 'rice' },
  { id: 'my-114', name: 'Nasi Briyani Kambing', calories: 620, proteinG: 32, carbsG: 78, fatG: 22, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  { id: 'my-115', name: 'Nasi Ayam Hainan', calories: 500, proteinG: 28, carbsG: 66, fatG: 16, servingQty: 1, servingUnit: 'plate', category: 'rice' },
  // More noodles
  { id: 'my-120', name: 'Mihun Goreng', calories: 400, proteinG: 10, carbsG: 62, fatG: 12, servingQty: 1, servingUnit: 'plate', category: 'noodles' },
  { id: 'my-121', name: 'Kolo Mee', calories: 450, proteinG: 16, carbsG: 64, fatG: 14, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-122', name: 'Curry Mee', calories: 490, proteinG: 16, carbsG: 58, fatG: 22, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-123', name: 'Sarawak Laksa', calories: 380, proteinG: 18, carbsG: 50, fatG: 14, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-124', name: 'Lor Mee', calories: 420, proteinG: 14, carbsG: 65, fatG: 11, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-125', name: 'Prawn Mee Soup', calories: 360, proteinG: 20, carbsG: 52, fatG: 8, servingQty: 1, servingUnit: 'bowl', category: 'noodles' },
  { id: 'my-126', name: 'Chee Cheong Fun', calories: 280, proteinG: 8, carbsG: 52, fatG: 5, servingQty: 1, servingUnit: 'plate', category: 'noodles' },
  // More proteins
  { id: 'my-130', name: 'Ayam Percik', calories: 340, proteinG: 36, carbsG: 10, fatG: 18, servingQty: 1, servingUnit: 'piece', category: 'protein' },
  { id: 'my-131', name: 'Ikan Patin Masak Tempoyak', calories: 300, proteinG: 26, carbsG: 8, fatG: 18, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-132', name: 'Sotong Goreng Tepung', calories: 260, proteinG: 16, carbsG: 24, fatG: 10, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-133', name: 'Telur Dadar', calories: 160, proteinG: 10, carbsG: 2, fatG: 12, servingQty: 1, servingUnit: 'piece', category: 'protein' },
  { id: 'my-134', name: 'Telur Rebus', calories: 78, proteinG: 6, carbsG: 0.5, fatG: 5, servingQty: 1, servingUnit: 'egg', category: 'protein' },
  { id: 'my-135', name: 'Daging Bakar', calories: 280, proteinG: 32, carbsG: 0, fatG: 16, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-136', name: 'Ketam Masak Lemak', calories: 320, proteinG: 22, carbsG: 12, fatG: 20, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-137', name: 'Ayam Tandoori', calories: 290, proteinG: 38, carbsG: 6, fatG: 12, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-138', name: 'Sambal Udang', calories: 240, proteinG: 20, carbsG: 14, fatG: 12, servingQty: 1, servingUnit: 'serving', category: 'protein' },
  { id: 'my-139', name: 'Dhal Curry', calories: 180, proteinG: 10, carbsG: 26, fatG: 5, servingQty: 1, servingUnit: 'cup', category: 'protein' },
  // More vegetables & sides
  { id: 'my-140', name: 'Bayam Tumis', calories: 80, proteinG: 4, carbsG: 8, fatG: 4, servingQty: 1, servingUnit: 'serving', category: 'vegetable' },
  { id: 'my-141', name: 'Pucuk Paku Goreng', calories: 90, proteinG: 3, carbsG: 10, fatG: 5, servingQty: 1, servingUnit: 'serving', category: 'vegetable' },
  { id: 'my-142', name: 'Bendi Goreng', calories: 100, proteinG: 3, carbsG: 12, fatG: 5, servingQty: 1, servingUnit: 'serving', category: 'vegetable' },
  { id: 'my-143', name: 'Terung Masak Lemak', calories: 130, proteinG: 3, carbsG: 14, fatG: 8, servingQty: 1, servingUnit: 'serving', category: 'vegetable' },
  { id: 'my-144', name: 'Kobis Goreng', calories: 85, proteinG: 3, carbsG: 10, fatG: 4, servingQty: 1, servingUnit: 'serving', category: 'vegetable' },
  { id: 'my-145', name: 'Peria Goreng', calories: 75, proteinG: 3, carbsG: 8, fatG: 4, servingQty: 1, servingUnit: 'serving', category: 'vegetable' },
  // More snacks / kuih
  { id: 'my-150', name: 'Kuih Bahulu', calories: 110, proteinG: 3, carbsG: 20, fatG: 2, servingQty: 3, servingUnit: 'pieces', category: 'snack' },
  { id: 'my-151', name: 'Kuih Cincin', calories: 180, proteinG: 2, carbsG: 32, fatG: 5, servingQty: 1, servingUnit: 'serving', category: 'snack' },
  { id: 'my-152', name: 'Kuih Onde-onde', calories: 60, proteinG: 1, carbsG: 12, fatG: 1, servingQty: 3, servingUnit: 'pieces', category: 'snack' },
  { id: 'my-153', name: 'Kuih Dadar', calories: 130, proteinG: 3, carbsG: 22, fatG: 4, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-154', name: 'Kuih Tepung Pelita', calories: 100, proteinG: 2, carbsG: 18, fatG: 3, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-155', name: 'Curry Puff', calories: 220, proteinG: 5, carbsG: 26, fatG: 10, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-156', name: 'Cucur Badak', calories: 140, proteinG: 3, carbsG: 22, fatG: 5, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-157', name: 'Lepat Pisang', calories: 120, proteinG: 2, carbsG: 24, fatG: 3, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-158', name: 'Epok-epok', calories: 200, proteinG: 4, carbsG: 28, fatG: 8, servingQty: 1, servingUnit: 'piece', category: 'snack' },
  { id: 'my-159', name: 'Keropok Lekor', calories: 170, proteinG: 8, carbsG: 24, fatG: 5, servingQty: 1, servingUnit: 'serving', category: 'snack' },
  // More desserts
  { id: 'my-160', name: 'Kuih Talam', calories: 115, proteinG: 2, carbsG: 22, fatG: 3, servingQty: 1, servingUnit: 'piece', category: 'dessert' },
  { id: 'my-161', name: 'Pengat Pisang', calories: 200, proteinG: 2, carbsG: 42, fatG: 4, servingQty: 1, servingUnit: 'bowl', category: 'dessert' },
  { id: 'my-162', name: 'Bubur Pulut Hitam', calories: 240, proteinG: 5, carbsG: 48, fatG: 5, servingQty: 1, servingUnit: 'bowl', category: 'dessert' },
  { id: 'my-163', name: 'Sago Gula Melaka', calories: 260, proteinG: 1, carbsG: 60, fatG: 4, servingQty: 1, servingUnit: 'bowl', category: 'dessert' },
  { id: 'my-164', name: 'Tapai', calories: 150, proteinG: 2, carbsG: 35, fatG: 0.5, servingQty: 100, servingUnit: 'g', category: 'dessert' },
  // More beverages
  { id: 'my-170', name: 'Teh Halia', calories: 90, proteinG: 2, carbsG: 16, fatG: 2, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-171', name: 'Bandung', calories: 140, proteinG: 2, carbsG: 32, fatG: 1, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-172', name: 'Jus Limau Ais', calories: 70, proteinG: 0.5, carbsG: 18, fatG: 0, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-173', name: 'Air Tebu', calories: 180, proteinG: 0, carbsG: 45, fatG: 0, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-174', name: 'Kopi Ais', calories: 100, proteinG: 2, carbsG: 18, fatG: 2, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-175', name: 'Jus Jambu Batu', calories: 110, proteinG: 1, carbsG: 28, fatG: 0, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-176', name: 'Neslo Ais', calories: 160, proteinG: 4, carbsG: 28, fatG: 4, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  { id: 'my-177', name: 'Air Longan', calories: 130, proteinG: 1, carbsG: 32, fatG: 0, servingQty: 1, servingUnit: 'cup', category: 'beverage' },
  // More fruits
  { id: 'my-180', name: 'Cempedak', calories: 116, proteinG: 2, carbsG: 28, fatG: 0.5, servingQty: 100, servingUnit: 'g', category: 'fruit' },
  { id: 'my-181', name: 'Nangka', calories: 95, proteinG: 2, carbsG: 24, fatG: 0.5, servingQty: 100, servingUnit: 'g', category: 'fruit' },
  { id: 'my-182', name: 'Langsat', calories: 57, proteinG: 1, carbsG: 15, fatG: 0, servingQty: 5, servingUnit: 'pieces', category: 'fruit' },
  { id: 'my-183', name: 'Jambu Air', calories: 25, proteinG: 0.5, carbsG: 6, fatG: 0, servingQty: 1, servingUnit: 'medium', category: 'fruit' },
  { id: 'my-184', name: 'Buah Duku', calories: 70, proteinG: 1, carbsG: 18, fatG: 0, servingQty: 5, servingUnit: 'pieces', category: 'fruit' },
  { id: 'my-185', name: 'Tembikai', calories: 30, proteinG: 0.5, carbsG: 8, fatG: 0, servingQty: 1, servingUnit: 'slice', category: 'fruit' },
  { id: 'my-186', name: 'Belimbing', calories: 31, proteinG: 1, carbsG: 7, fatG: 0, servingQty: 1, servingUnit: 'medium', category: 'fruit' },
  { id: 'my-187', name: 'Nenas', calories: 50, proteinG: 0.5, carbsG: 13, fatG: 0, servingQty: 1, servingUnit: 'slice', category: 'fruit' },
  // Soups & curries
  { id: 'my-190', name: 'Sup Tulang', calories: 280, proteinG: 24, carbsG: 12, fatG: 16, servingQty: 1, servingUnit: 'bowl', category: 'soup' },
  { id: 'my-191', name: 'Sup Ayam', calories: 180, proteinG: 20, carbsG: 8, fatG: 8, servingQty: 1, servingUnit: 'bowl', category: 'soup' },
  { id: 'my-192', name: 'Gulai Ikan', calories: 260, proteinG: 22, carbsG: 10, fatG: 16, servingQty: 1, servingUnit: 'serving', category: 'soup' },
  { id: 'my-193', name: 'Masak Lemak Cili Api', calories: 300, proteinG: 20, carbsG: 14, fatG: 20, servingQty: 1, servingUnit: 'serving', category: 'soup' },
  { id: 'my-194', name: 'Soto Ayam', calories: 320, proteinG: 22, carbsG: 30, fatG: 12, servingQty: 1, servingUnit: 'bowl', category: 'soup' },
  { id: 'my-195', name: 'Tom Yam', calories: 150, proteinG: 12, carbsG: 14, fatG: 6, servingQty: 1, servingUnit: 'bowl', category: 'soup' },
];

export function searchLocalFoods(query: string): LocalFood[] {
  if (!query.trim()) return MALAYSIAN_FOODS.slice(0, 25);
  const q = query.toLowerCase();
  return MALAYSIAN_FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 30);
}
