import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const diseases = [
  {
    crop: 'rice',
    name: 'Blast',
    localName: 'झुलसा रोग',
    scientificName: 'Magnaporthe oryzae',
    symptoms: ['Diamond-shaped lesions on leaves', 'Gray center with brown border', 'Neck blast on panicles'],
    causes: 'Fungal infection spread by airborne spores, favors high humidity and nitrogen-rich conditions',
    organicTreatment: 'Neem oil spray (5ml/L) + garlic extract; silica supplementation',
    chemicalTreatment: 'Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane 40% EC @ 1.5ml/L',
    prevention: 'Use resistant varieties, avoid excess nitrogen, maintain proper spacing',
    confidenceScore: 0.92,
    seasonMonths: [6, 7, 8, 9, 10],
    regions: ['North India', 'South India', 'East India', 'Punjab', 'Andhra Pradesh', 'Telangana'],
  },
  {
    crop: 'rice',
    name: 'Brown Plant Hopper',
    localName: 'भूरा फुदका',
    scientificName: 'Nilaparvata lugens',
    symptoms: ['Hopperburn - circular patches of dried plants', 'Honeydew secretion with sooty mold', 'Plants feel sticky'],
    causes: 'Insect pest, thrives in humid conditions with dense planting',
    organicTreatment: 'Neem-based insecticides; conserve natural predators (spiders, dragonflies)',
    chemicalTreatment: 'Buprofezin 25% SC @ 1ml/L or Pymetrozine 50% WG @ 0.3g/L',
    prevention: 'Avoid continuous water submergence, use light traps, plant resistant varieties',
    confidenceScore: 0.88,
    seasonMonths: [7, 8, 9, 10],
    regions: ['Punjab', 'Haryana', 'West Bengal', 'Andhra Pradesh', 'Tamil Nadu'],
  },
  {
    crop: 'wheat',
    name: 'Yellow Rust',
    localName: 'पीला रतुआ',
    scientificName: 'Puccinia striiformis',
    symptoms: ['Yellow stripe pattern on leaves', 'Powdery yellow spores on linear stripes', 'Leaves turn brown and dry'],
    causes: 'Fungal pathogen favored by cool (10-20°C) and humid weather',
    organicTreatment: 'Sulfur-based spray (2g/L); avoid excessive nitrogen',
    chemicalTreatment: 'Tebuconazole 25.9% EW @ 1ml/L or Propiconazole 25% EC @ 0.5ml/L',
    prevention: 'Early sowing, resistant varieties (HDCSW varieties), avoid dense canopy',
    confidenceScore: 0.95,
    seasonMonths: [1, 2, 3, 11, 12],
    regions: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan'],
  },
  {
    crop: 'wheat',
    name: 'Loose Smut',
    localName: 'खुला कंड',
    scientificName: 'Ustilago segetum',
    symptoms: ['Black spore mass replacing grain heads', 'Spores blow away leaving bare rachis', 'Fishy odor in field'],
    causes: 'Seed-borne fungal infection, survives in seed embryo',
    organicTreatment: 'Hot water seed treatment (52°C for 10 min); solar seed treatment',
    chemicalTreatment: 'Seed treatment with Carboxin 37.5% WS @ 2g/kg seed or Vitavax',
    prevention: 'Use certified disease-free seed, seed treatment before sowing',
    confidenceScore: 0.9,
    seasonMonths: [2, 3],
    regions: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Bihar'],
  },
  {
    crop: 'cotton',
    name: 'Bollworm Complex',
    localName: 'फल की सुंडी',
    scientificName: 'Helicoverpa armigera',
    symptoms: ['Entry holes in bolls', 'Larvae feeding inside bolls', 'Stained lint and rotting'],
    causes: 'Polyphagous pest, multiple generations per season',
    organicTreatment: 'Neem seed kernel extract (NSKE) 5%; Trichogramma egg cards',
    chemicalTreatment: 'Emamectin benzoate 5% SG @ 0.4g/L or Spinosad 45% SC @ 0.3ml/L',
    prevention: 'Install pheromone traps @ 12/ha, intercropping with cowpea, timely sowing',
    confidenceScore: 0.87,
    seasonMonths: [8, 9, 10, 11],
    regions: ['Maharashtra', 'Gujarat', 'Telangana', 'Madhya Pradesh', 'Punjab'],
  },
  {
    crop: 'cotton',
    name: 'Whitefly',
    localName: 'सफेद मक्खी',
    scientificName: 'Bemisia tabaci',
    symptoms: ['Silver leaves', 'Sticky honeydew with sooty mold', 'Stunted growth, leaf curl'],
    causes: 'Sap-sucking insect vector for leaf curl virus, thrives in hot dry weather',
    organicTreatment: 'Yellow sticky traps @ 12/acre; neem oil spray 2%; release Encarsia wasps',
    chemicalTreatment: 'Spiromesifen 22.9% SC @ 1ml/L or Diafenthiuron 50% WP @ 0.4g/L',
    prevention: 'Avoid monocropping, border crop with maize, timely removal of weed hosts',
    confidenceScore: 0.85,
    seasonMonths: [7, 8, 9, 10],
    regions: ['Punjab', 'Haryana', 'Maharashtra', 'Gujarat', 'Telangana'],
  },
  {
    crop: 'maize',
    name: 'Fall Armyworm',
    localName: 'सेना की इल्ली',
    scientificName: 'Spodoptera frugiperda',
    symptoms: ['Ragged feeding damage in whorl', 'Frass (greenish pellets) near whorl', 'Window-pane damage on leaves'],
    causes: 'Highly invasive pest from Americas, now across Asia and Africa',
    organicTreatment: 'Neem oil + soap spray; sand + ash mixture in whorl (1:1); Beauveria bassiana',
    chemicalTreatment: 'Spinetoram 11.7% SC @ 0.5ml/L or Emamectin benzoate 5% SG @ 0.4g/L',
    prevention: 'Early detection, pheromone traps, intercropping with legumes',
    confidenceScore: 0.93,
    seasonMonths: [3, 4, 5, 6, 7, 8, 9],
    regions: ['Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Madhya Pradesh', 'Bihar'],
  },
  {
    crop: 'tomato',
    name: 'Early Blight',
    localName: 'अगेती झुलसा',
    scientificName: 'Alternaria solani',
    symptoms: ['Dark concentric ring spots on older leaves', 'Yellowing around lesions', 'Defoliation starting from bottom'],
    causes: 'Fungal disease favored by warm, humid conditions and wet foliage',
    organicTreatment: 'Copper oxychloride 2g/L; Trichoderma spray; neem cake soil application',
    chemicalTreatment: 'Mancozeb 75% WP @ 2g/L or Chlorothalonil 75% WP @ 2g/L',
    prevention: 'Avoid overhead irrigation, stake plants, mulch to prevent soil splash',
    confidenceScore: 0.89,
    seasonMonths: [2, 3, 7, 8, 9, 10],
    regions: ['All India tomato growing regions', 'Maharashtra', 'Karnataka', 'Himachal'],
  },
  {
    crop: 'tomato',
    name: 'Late Blight',
    localName: 'पछेती झुलसा',
    scientificName: 'Phytophthora infestans',
    symptoms: ['Water-soaked lesions on leaves/stem', 'White cottony mycelium on underside', 'Brown irregular spots on fruits'],
    causes: 'Oomycete pathogen, explosive spread in cool, wet weather',
    organicTreatment: 'Bordeaux mixture (1%); copper hydroxide spray',
    chemicalTreatment: 'Metalaxyl + Mancozeb 72% WP @ 2g/L or Dimethomorph 50% SC @ 1ml/L',
    prevention: 'Resistant varieties, avoid dense planting, remove infected plants immediately',
    confidenceScore: 0.91,
    seasonMonths: [1, 7, 8, 11, 12],
    regions: ['Himachal', 'Uttarakhand', 'Karnataka', 'Maharashtra'],
  },
  {
    crop: 'banana',
    name: 'Panama Wilt',
    localName: 'पनामा विल्ट',
    scientificName: 'Fusarium oxysporum f.sp. cubense',
    symptoms: ['Internal pseudostem discoloration (red-brown)', 'Lower leaves yellow and collapse', 'Pseudostem splits'],
    causes: 'Soil-borne fungus, persists years in soil, enters through roots',
    organicTreatment: 'No cure for infected plants; soil solarization; Trichoderma + neem cake enrichment',
    chemicalTreatment: 'No effective chemical cure; quarantine and remove infected plants',
    prevention: 'Use tissue-culture plants, resistant Cavendish varieties, crop rotation with paddy',
    confidenceScore: 0.94,
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    regions: ['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Andhra Pradesh', 'Karnataka', 'Bihar'],
  },
];

async function main() {
  console.log('Seeding disease database...');

  for (const disease of diseases) {
    const id = `${disease.crop}_${disease.name.replace(/\s+/g, '_').toLowerCase()}`;
    await prisma.diseaseDB.upsert({
      where: { id },
      update: disease,
      create: { id, ...disease },
    });
  }

  console.log(`Seeded ${diseases.length} diseases`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
