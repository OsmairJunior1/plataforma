// =====================================================
//  VGR ACADEMY — DADOS DOS CURSOS
//  Substitua pelas informações reais dos seus cursos
// =====================================================

const COURSES = [
  {
    id: 1,
    title: "Marketing Digital do Zero ao Avançado",
    category: "marketing",
    tags: ["SEO", "Tráfego Pago", "Social Media"],
    thumb: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80",
    desc: "Aprenda as estratégias mais poderosas de marketing digital usadas pelas maiores empresas do mundo.",
    lessons: 48,
    duration: "12h 30min",
    rating: 4.9,
    level: "Iniciante",
    badge: "hot",
    progress: 0,
    instructor: "Prof. André Lima"
  },
  {
    id: 2,
    title: "SEO Avançado — Rank #1 no Google",
    category: "marketing",
    tags: ["SEO", "Link Building", "Google"],
    thumb: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1600&q=80",
    desc: "Domine as técnicas de SEO que colocam qualquer site na primeira posição do Google de forma orgânica.",
    lessons: 36,
    duration: "9h 15min",
    rating: 4.8,
    level: "Avançado",
    badge: "new",
    progress: 62,
    instructor: "Prof. André Lima"
  },
  {
    id: 3,
    title: "Tráfego Pago: Meta & Google Ads",
    category: "marketing",
    tags: ["Meta Ads", "Google Ads", "ROI"],
    thumb: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=1600&q=80",
    desc: "Crie campanhas de tráfego pago que geram resultados reais com o menor custo por aquisição possível.",
    lessons: 52,
    duration: "14h 00min",
    rating: 4.9,
    level: "Intermediário",
    badge: "top",
    progress: 0,
    instructor: "Prof. André Lima"
  },
  {
    id: 4,
    title: "Empreendedorismo Digital na Prática",
    category: "negocios",
    tags: ["Negócios", "Startups", "Receita"],
    thumb: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&q=80",
    desc: "Monte seu negócio online do zero: produto, audiência, vendas e escala em um único curso completo.",
    lessons: 44,
    duration: "11h 20min",
    rating: 4.7,
    level: "Iniciante",
    badge: "",
    progress: 30,
    instructor: "Prof. André Lima"
  },
  {
    id: 5,
    title: "Copywriting que Vende",
    category: "vendas",
    tags: ["Copy", "Persuasão", "VSL"],
    thumb: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1600&q=80",
    desc: "Escreva textos persuasivos que vendem produtos, captam leads e constroem marcas poderosas.",
    lessons: 28,
    duration: "7h 45min",
    rating: 4.8,
    level: "Iniciante",
    badge: "new",
    progress: 0,
    instructor: "Prof. André Lima"
  },
  {
    id: 6,
    title: "Branding: Construa uma Marca Poderosa",
    category: "design",
    tags: ["Marca", "Identidade Visual", "Posicionamento"],
    thumb: "https://images.unsplash.com/photo-1493421419110-74f4e85ba126?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1493421419110-74f4e85ba126?w=1600&q=80",
    desc: "Aprenda a criar identidades de marca memoráveis que conquistam clientes e geram autoridade no mercado.",
    lessons: 32,
    duration: "8h 10min",
    rating: 4.6,
    level: "Intermediário",
    badge: "",
    progress: 100,
    instructor: "Prof. André Lima"
  },
  {
    id: 7,
    title: "Funil de Vendas Automatizado",
    category: "vendas",
    tags: ["Funil", "Automação", "E-mail Marketing"],
    thumb: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=1600&q=80",
    desc: "Construa funis de vendas que trabalham por você 24 horas por dia, gerando receita no piloto automático.",
    lessons: 40,
    duration: "10h 30min",
    rating: 4.9,
    level: "Avançado",
    badge: "hot",
    progress: 0,
    instructor: "Prof. André Lima"
  },
  {
    id: 8,
    title: "Python para Iniciantes",
    category: "tecnologia",
    tags: ["Python", "Programação", "Automação"],
    thumb: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&q=80",
    desc: "Do zero ao profissional em Python: automatize tarefas, crie scripts e entre no mundo da programação.",
    lessons: 60,
    duration: "16h 00min",
    rating: 4.8,
    level: "Iniciante",
    badge: "new",
    progress: 0,
    instructor: "Prof. André Lima"
  },
  {
    id: 9,
    title: "Finanças Pessoais & Investimentos",
    category: "financas",
    tags: ["Dinheiro", "Investimentos", "FIRE"],
    thumb: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1600&q=80",
    desc: "Controle seu dinheiro, saia das dívidas e comece a investir para a liberdade financeira.",
    lessons: 35,
    duration: "9h 00min",
    rating: 4.7,
    level: "Iniciante",
    badge: "",
    progress: 15,
    instructor: "Prof. André Lima"
  },
  {
    id: 10,
    title: "Design Gráfico com Canva Pro",
    category: "design",
    tags: ["Canva", "Design", "Criativo"],
    thumb: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1600&q=80",
    desc: "Crie artes profissionais para redes sociais, apresentações e materiais de marketing sem precisar de designer.",
    lessons: 24,
    duration: "6h 20min",
    rating: 4.6,
    level: "Iniciante",
    badge: "free",
    progress: 0,
    instructor: "Prof. André Lima"
  },
  {
    id: 11,
    title: "Vendas Consultivas B2B",
    category: "vendas",
    tags: ["Vendas", "B2B", "Negociação"],
    thumb: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80",
    desc: "Técnicas avançadas de vendas consultivas para fechar contratos maiores e fidelizar clientes empresariais.",
    lessons: 38,
    duration: "10h 00min",
    rating: 4.9,
    level: "Avançado",
    badge: "top",
    progress: 0,
    instructor: "Prof. André Lima"
  },
  {
    id: 12,
    title: "Instagram para Negócios",
    category: "marketing",
    tags: ["Instagram", "Reels", "Stories"],
    thumb: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=75",
    hero: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1600&q=80",
    desc: "Transforme seu Instagram em uma máquina de vendas: estratégia de conteúdo, crescimento e conversão.",
    lessons: 30,
    duration: "8h 00min",
    rating: 4.7,
    level: "Iniciante",
    badge: "hot",
    progress: 0,
    instructor: "Prof. André Lima"
  }
];

// Lessons dataset para o player
const LESSONS = {
  1: [
    { module: "Módulo 1: Fundamentos", lessons: [
      { id: 1, title: "Boas-vindas ao curso", duration: "5:20", done: true, thumb: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=60" },
      { id: 2, title: "O que é Marketing Digital?", duration: "12:45", done: true, thumb: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&q=60" },
      { id: 3, title: "As 4 Pilares do Marketing", duration: "18:30", done: false, thumb: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=200&q=60" },
      { id: 4, title: "Definindo seu público-alvo", duration: "22:15", done: false, thumb: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&q=60" },
    ]},
    { module: "Módulo 2: Canais Digitais", lessons: [
      { id: 5, title: "Redes Sociais — Visão Geral", duration: "15:00", done: false, thumb: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&q=60" },
      { id: 6, title: "E-mail Marketing que converte", duration: "20:10", done: false, thumb: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=200&q=60" },
      { id: 7, title: "SEO: Primeiros Passos", duration: "25:45", done: false, thumb: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&q=60" },
    ]},
    { module: "Módulo 3: Vendas Online", lessons: [
      { id: 8, title: "Criando sua oferta irresistível", duration: "28:00", done: false, thumb: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&q=60" },
      { id: 9, title: "Landing Pages que convertem", duration: "19:30", done: false, thumb: "https://images.unsplash.com/photo-1493421419110-74f4e85ba126?w=200&q=60" },
      { id: 10, title: "Métricas e análise de dados", duration: "23:15", done: false, thumb: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=200&q=60" },
    ]},
  ]
};

// My list (saved courses) — começa vazia; populada via Supabase no auth
let MY_LIST = [];

// Recently watched
const RECENTLY_WATCHED = [2, 4, 9, 6];
