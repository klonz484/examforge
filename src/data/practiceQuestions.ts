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


const mathematicsG10: PracticeQuestion[] = [
  { id:'math-g10-algebra-001',grade:10,subjectId:'mathematics',subject:'Mathematics',topic:'Algebraic expressions',prompt:'Simplify: 3x + 2x − 4.',options:['5x − 4','5x + 4','6x − 4','x − 4'],answer:0,explanation:'Collect like terms: 3x + 2x = 5x. The constant −4 remains, giving 5x − 4.',sourceLabel:original,provenance },
  { id:'math-g10-exponents-001',grade:10,subjectId:'mathematics',subject:'Mathematics',topic:'Exponents and surds',prompt:'Simplify 2³ × 2².',options:['2⁶','2⁵','4⁵','2¹'],answer:1,explanation:'When multiplying powers with the same base, add exponents: 2³ × 2² = 2⁵ = 32.',sourceLabel:original,provenance },
  { id:'math-g10-equations-001',grade:10,subjectId:'mathematics',subject:'Mathematics',topic:'Equations and inequalities',prompt:'Solve for x: 2x + 5 = 17.',options:['x = 5','x = 6','x = 7','x = 11'],answer:1,explanation:'Subtract 5 from both sides: 2x = 12. Divide by 2: x = 6.',sourceLabel:original,provenance },
  { id:'math-g10-functions-001',grade:10,subjectId:'mathematics',subject:'Mathematics',topic:'Functions and graphs',prompt:'For f(x) = 2x + 1, determine f(3).',options:['5','6','7','8'],answer:2,explanation:'Substitute x = 3: f(3) = 2(3) + 1 = 7.',sourceLabel:original,provenance },
  { id:'math-g10-trigonometry-001',grade:10,subjectId:'mathematics',subject:'Mathematics',topic:'Trigonometry',prompt:'In a right-angled triangle, the side opposite θ is 3 and the hypotenuse is 5. What is sin θ?',options:['3/5','4/5','3/4','5/3'],answer:0,explanation:'sin θ = opposite ÷ hypotenuse = 3 ÷ 5 = 3/5.',sourceLabel:original,provenance },
]

const mathematicsG11: PracticeQuestion[] = [
  { id:'math-g11-quadratics-001',grade:11,subjectId:'mathematics',subject:'Mathematics',topic:'Quadratic equations',prompt:'Solve x² − 5x + 6 = 0.',options:['x = 2 or x = 3','x = −2 or x = −3','x = 1 or x = 6','x = −1 or x = −6'],answer:0,explanation:'Factorise: (x − 2)(x − 3) = 0. Therefore x = 2 or x = 3.',sourceLabel:original,provenance },
  { id:'math-g11-sequences-001',grade:11,subjectId:'mathematics',subject:'Mathematics',topic:'Number patterns, sequences and series',prompt:'An arithmetic sequence starts 5 ; 8 ; 11 ; … What is its 10th term?',options:['29','30','32','35'],answer:2,explanation:'The first term is 5 and the common difference is 3. T₁₀ = 5 + 9(3) = 32.',sourceLabel:original,provenance },
  { id:'math-g11-functions-001',grade:11,subjectId:'mathematics',subject:'Mathematics',topic:'Functions and graphs',prompt:'What is the turning point of y = (x − 1)² + 4?',options:['(−1 ; 4)','(1 ; 4)','(1 ; −4)','(4 ; 1)'],answer:1,explanation:'In y = a(x − p)² + q, the turning point is (p ; q), so it is (1 ; 4).',sourceLabel:original,provenance },
  { id:'math-g11-trigonometry-001',grade:11,subjectId:'mathematics',subject:'Mathematics',topic:'Trigonometry',prompt:'What is the exact value of sin 30°?',options:['0','1/2','√3/2','1'],answer:1,explanation:'The standard special-angle value is sin 30° = 1/2.',sourceLabel:original,provenance },
  { id:'math-g11-analytical-001',grade:11,subjectId:'mathematics',subject:'Mathematics',topic:'Analytical Geometry',prompt:'Determine the gradient of the line through (1 ; 2) and (3 ; 6).',options:['1','2','3','4'],answer:1,explanation:'m = (y₂ − y₁)/(x₂ − x₁) = (6 − 2)/(3 − 1) = 2.',sourceLabel:original,provenance },
]

const physicalScienceG10: PracticeQuestion[] = [
  { id:'science-g10-waves-001',grade:10,subjectId:'physical-science',subject:'Physical Science',topic:'Waves, sound and light',prompt:'A wave has a frequency of 4 Hz and a wavelength of 0.5 m. What is its speed?',options:['0.125 m·s⁻¹','2 m·s⁻¹','4.5 m·s⁻¹','8 m·s⁻¹'],answer:1,explanation:'Use v = fλ = 4 × 0.5 = 2 m·s⁻¹.',sourceLabel:original,provenance },
  { id:'science-g10-circuits-001',grade:10,subjectId:'physical-science',subject:'Physical Science',topic:'Electric circuits',prompt:'In a simple series circuit, which quantity is the same through every component?',options:['Potential difference','Current','Resistance','Electrical energy'],answer:1,explanation:'In a series circuit there is only one path, so the same current flows through every component.',sourceLabel:original,provenance },
  { id:'science-g10-electrostatics-001',grade:10,subjectId:'physical-science',subject:'Physical Science',topic:'Electrostatics',prompt:'An initially neutral object gains electrons. What is its net charge?',options:['Positive','Negative','Still neutral','It has no charge carriers'],answer:1,explanation:'Electrons carry negative charge. Gaining electrons gives the object an overall negative charge.',sourceLabel:original,provenance },
  { id:'science-g10-atomic-001',grade:10,subjectId:'physical-science',subject:'Physical Science',topic:'Matter and materials: atomic structure',prompt:'Which quantity is equal to the number of protons in an atom?',options:['Mass number','Number of neutrons','Atomic number','Number of shells'],answer:2,explanation:'The atomic number is defined as the number of protons in the nucleus.',sourceLabel:original,provenance },
  { id:'science-g10-chemical-001',grade:10,subjectId:'physical-science',subject:'Physical Science',topic:'Chemical change',prompt:'Which statement describes an endothermic process?',options:['Energy is released to the surroundings','Energy is absorbed from the surroundings','No energy is transferred','The mass of the system disappears'],answer:1,explanation:'An endothermic process absorbs energy from its surroundings.',sourceLabel:original,provenance },
]

const physicalScienceG11: PracticeQuestion[] = [
  { id:'science-g11-newton-001',grade:11,subjectId:'physical-science',subject:'Physical Science',topic:'Mechanics: Newton’s laws',prompt:'A net force of 10 N acts on a 5 kg object. What is its acceleration?',options:['0.5 m·s⁻²','2 m·s⁻²','5 m·s⁻²','50 m·s⁻²'],answer:1,explanation:'Newton’s second law: Fₙₑₜ = ma, so a = F/m = 10/5 = 2 m·s⁻².',sourceLabel:original,provenance },
  { id:'science-g11-gravity-001',grade:11,subjectId:'physical-science',subject:'Physical Science',topic:'Newton’s law of universal gravitation',prompt:'Calculate the weight of a 2 kg object near Earth’s surface. Use g = 9.8 m·s⁻².',options:['2 N','9.8 N','19.6 N','196 N'],answer:2,explanation:'Weight is W = mg = 2 × 9.8 = 19.6 N.',sourceLabel:original,provenance },
  { id:'science-g11-momentum-001',grade:11,subjectId:'physical-science',subject:'Physical Science',topic:'Momentum and impulse',prompt:'A 0.5 kg ball moves at 8 m·s⁻¹. What is its momentum?',options:['0.0625 kg·m·s⁻¹','4 kg·m·s⁻¹','8.5 kg·m·s⁻¹','16 kg·m·s⁻¹'],answer:1,explanation:'Momentum p = mv = 0.5 × 8 = 4 kg·m·s⁻¹.',sourceLabel:original,provenance },
  { id:'science-g11-stoichiometry-001',grade:11,subjectId:'physical-science',subject:'Physical Science',topic:'Chemical change and stoichiometry',prompt:'How many moles are in 36 g of water? The molar mass of water is 18 g·mol⁻¹.',options:['0.5 mol','1 mol','2 mol','18 mol'],answer:2,explanation:'n = m/M = 36/18 = 2 mol.',sourceLabel:original,provenance },
  { id:'science-g11-electricity-001',grade:11,subjectId:'physical-science',subject:'Physical Science',topic:'Electric circuits and magnetism',prompt:'A charge of 12 C passes a point in 3 s. What is the current?',options:['0.25 A','3 A','4 A','36 A'],answer:2,explanation:'Current I = Q/Δt = 12/3 = 4 A.',sourceLabel:original,provenance },
]

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [...mathematicsG10, ...mathematicsG11, ...mathematics, ...physicalScienceG10, ...physicalScienceG11, ...physicalScience]

export function selectPracticeQuestions(subjectId: string, grade: number, weakTopics: string[], count = 5): PracticeQuestion[] {
  const eligible = PRACTICE_QUESTIONS.filter(question => question.subjectId === subjectId && question.grade === grade)
  const priority = eligible.filter(question => weakTopics.includes(question.topic))
  const remainder = eligible.filter(question => !weakTopics.includes(question.topic))
  const shuffle = (rows: PracticeQuestion[]) => {
    const result = [...rows]
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1))
      ;[result[index], result[swap]] = [result[swap], result[index]]
    }
    return result
  }
  return [...shuffle(priority), ...shuffle(remainder)].slice(0, count)
}

export function getPracticeTopics(subjectId: string, grade: number): string[] {
  return Array.from(new Set(
    PRACTICE_QUESTIONS
      .filter(question => question.subjectId === subjectId && question.grade === grade)
      .map(question => question.topic),
  ))
}
