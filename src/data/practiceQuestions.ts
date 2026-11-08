export type PracticeQuestion = {
  id: string
  grade: 10 | 11 | 12
  subjectId: 'mathematics' | 'physical-science'
  subject: 'Mathematics' | 'Physical Science'
  topic: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
  sourceLabel: 'ExamForge original practice'
  provenance: 'Author-created learning material; not an official DBE question or past-paper extract.'
}

const original = 'ExamForge original practice' as const
const provenance = 'Author-created learning material; not an official DBE question or past-paper extract.' as const

const mathematics: PracticeQuestion[] = [
  { id:'math-g12-algebra-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Algebra', prompt:'Solve x² − 5x + 6 = 0.', options:['x = 2 or x = 3','x = −2 or x = −3','x = 1 or x = 6','x = −1 or x = 6'], answer:0, explanation:'Factorise: (x − 2)(x − 3) = 0. Therefore x = 2 or x = 3.', sourceLabel:original, provenance },
  { id:'math-g12-functions-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Functions', prompt:'What is the turning point of y = (x − 2)² + 3?', options:['(2 ; 3)','(−2 ; 3)','(2 ; −3)','(3 ; 2)'], answer:0, explanation:'In y = a(x − p)² + q, the turning point is (p ; q), so it is (2 ; 3).', sourceLabel:original, provenance },
  { id:'math-g12-trigonometry-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Trigonometry', prompt:'For any angle θ, what is the value of sin²θ + cos²θ?', options:['0','1','2','tan θ'], answer:1, explanation:'The Pythagorean identity states sin²θ + cos²θ = 1.', sourceLabel:original, provenance },
  { id:'math-g12-calculus-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Calculus', prompt:'Determine f′(x) if f(x) = x³.', options:['3x²','x²','3x','x⁴ ÷ 4'], answer:0, explanation:'Apply the power rule: d(xⁿ)/dx = nxⁿ⁻¹. Thus f′(x) = 3x².', sourceLabel:original, provenance },
  { id:'math-g12-euclidean-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Euclidean Geometry', prompt:'An angle at the centre and an angle at the circumference subtend the same arc. The central angle is …', options:['half the circumference angle','equal to the circumference angle','twice the circumference angle','three times the circumference angle'], answer:2, explanation:'The theorem states that the angle at the centre is twice the angle at the circumference standing on the same arc.', sourceLabel:original, provenance },
  { id:'math-g12-analytical-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Analytical Geometry', prompt:'Determine the gradient of the line through (1 ; 2) and (3 ; 6).', options:['1','2','4','½'], answer:1, explanation:'m = (6 − 2) ÷ (3 − 1) = 4 ÷ 2 = 2.', sourceLabel:original, provenance },
  { id:'math-g12-sequences-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Sequences & Series', prompt:'The arithmetic sequence is 3 ; 7 ; 11 ; … What is the 10th term?', options:['39','43','40','36'], answer:0, explanation:'Tₙ = a + (n − 1)d = 3 + 9(4) = 39.', sourceLabel:original, provenance },
  { id:'math-g12-finance-001', grade:12, subjectId:'mathematics', subject:'Mathematics', topic:'Finance & Growth', prompt:'R1 000 is invested at 10% per year, compounded annually, for 2 years. What is the final amount?', options:['R1 200','R1 210','R1 100','R1 220'], answer:1, explanation:'A = P(1 + i)ⁿ = 1 000(1.1)² = R1 210.', sourceLabel:original, provenance },
]

const physicalScience: PracticeQuestion[] = [
  { id:'science-g12-mechanics-001', grade:12, subjectId:'physical-science', subject:'Physical Science', topic:'Mechanics', prompt:'A block rests on a frictionless inclined plane at angle θ. What is the component of its weight perpendicular to the plane?', options:['mg sin θ','mg cos θ','mg tan θ','mg'], answer:1, explanation:'Resolve the weight into perpendicular and parallel components. The perpendicular component is mg cos θ.', sourceLabel:original, provenance },
  { id:'science-g12-electricity-001', grade:12, subjectId:'physical-science', subject:'Physical Science', topic:'Electricity', prompt:'Which equation relates potential difference, current and resistance for an ohmic conductor?', options:['P = VI','V = IR','Q = It','E = mc²'], answer:1, explanation:'Ohm’s law states V = IR when physical conditions remain constant.', sourceLabel:original, provenance },
  { id:'science-g12-electricity-002', grade:12, subjectId:'physical-science', subject:'Physical Science', topic:'Electricity', prompt:'What is the SI unit of electric charge?', options:['Ampere','Volt','Coulomb','Ohm'], answer:2, explanation:'Electric charge is measured in coulombs (C). Current is the rate of flow of charge.', sourceLabel:original, provenance },
  { id:'science-g12-waves-001', grade:12, subjectId:'physical-science', subject:'Physical Science', topic:'Waves', prompt:'A wave has a frequency of 5 Hz and a wavelength of 2 m. What is its speed?', options:['2.5 m·s⁻¹','7 m·s⁻¹','10 m·s⁻¹','20 m·s⁻¹'], answer:2, explanation:'Use v = fλ = 5 × 2 = 10 m·s⁻¹.', sourceLabel:original, provenance },
  { id:'science-g12-chemical-change-001', grade:12, subjectId:'physical-science', subject:'Physical Science', topic:'Chemical Change', prompt:'Which statement describes an exothermic reaction?', options:['Heat is absorbed from surroundings','Temperature must decrease','Energy is released to surroundings','No energy change occurs'], answer:2, explanation:'An exothermic reaction releases energy, usually as heat, to its surroundings.', sourceLabel:original, provenance },
  { id:'science-g12-momentum-001', grade:12, subjectId:'physical-science', subject:'Physical Science', topic:'Momentum & Impulse', prompt:'A 2 kg trolley moves at 3 m·s⁻¹. What is its momentum?', options:['1.5 kg·m·s⁻¹','5 kg·m·s⁻¹','6 kg·m·s⁻¹','9 kg·m·s⁻¹'], answer:2, explanation:'Momentum p = mv = 2 × 3 = 6 kg·m·s⁻¹.', sourceLabel:original, provenance },
  { id:'science-g12-work-001', grade:12, subjectId:'physical-science', subject:'Physical Science', topic:'Energy & Work', prompt:'A 10 N force moves an object 3 m in the direction of the force. How much work is done?', options:['3.3 J','13 J','30 J','300 J'], answer:2, explanation:'W = FΔx cos θ = 10 × 3 × cos 0° = 30 J.', sourceLabel:original, provenance },
  { id:'science-g12-stoichiometry-001', grade:12, subjectId:'physical-science', subject:'Physical Science', topic:'Stoichiometry', prompt:'How many moles are in 36 g of water? (M = 18 g·mol⁻¹)', options:['0.5 mol','2 mol','18 mol','648 mol'], answer:1, explanation:'n = m/M = 36 ÷ 18 = 2 mol.', sourceLabel:original, provenance },
  { id:'science-g12-organic-001', grade:12, subjectId:'physical-science', subject:'Physical Science', topic:'Organic Chemistry', prompt:'Which functional group is present in an alcohol?', options:['–COOH','–OH','–NH₂','–CHO'], answer:1, explanation:'Alcohols contain the hydroxyl group (–OH) attached to a carbon chain.', sourceLabel:original, provenance },
]

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [...mathematics, ...physicalScience]

export function selectPracticeQuestions(subjectId: string, grade: number, weakTopics: string[], count = 5): PracticeQuestion[] {
  const eligible = PRACTICE_QUESTIONS.filter(question => question.subjectId === subjectId && question.grade === grade)
  const priority = eligible.filter(question => weakTopics.includes(question.topic))
  const remainder = eligible.filter(question => !weakTopics.includes(question.topic))
  const shuffle = (rows: PracticeQuestion[]) => [...rows].sort(() => Math.random() - 0.5)
  return [...shuffle(priority), ...shuffle(remainder)].slice(0, count)
}
