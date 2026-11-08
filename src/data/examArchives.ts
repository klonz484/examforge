export type OfficialPaperArchive = {
  id: string
  year: number
  sitting: 'November' | 'May/June'
  grade: 12
  subjectId: 'mathematics' | 'physical-science'
  subjectName: 'Mathematics' | 'Physical Sciences'
  papers: readonly ['Paper 1', 'Paper 2']
  memos: readonly ['Memo 1', 'Memo 2']
  languages: readonly ['English', 'Afrikaans']
  sourceTitle: string
  sourceUrl: string
  sourceAuthority: 'Department of Basic Education'
  sourceKind: 'official-index-page'
  verifiedAt: '2026-11-08'
  accessNote: string
}

// Each URL opens the relevant DBE archive page; it is an index, not a direct PDF.
// Individual question-paper/memo links are presented on the destination page.
export const OFFICIAL_PAPER_ARCHIVES: OfficialPaperArchive[] = [
  ...([['mathematics','Mathematics'],['physical-science','Physical Sciences']] as const).map(([subjectId,subjectName]) => ({
    id:`dbe-2025-nov-${subjectId}`, year:2025, sitting:'November' as const, grade:12 as const,
    subjectId, subjectName, papers:['Paper 1','Paper 2'] as const, memos:['Memo 1','Memo 2'] as const,
    languages:['English','Afrikaans'] as const,
    sourceTitle:'2025 November NSC Examination Papers',
    sourceUrl:'https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/2025NovemberExamPapers.aspx',
    sourceAuthority:'Department of Basic Education' as const, sourceKind:'official-index-page' as const,
    verifiedAt:'2026-11-08' as const,
    accessNote:'The official DBE page lists English and Afrikaans papers and memos for this subject. Open the page and select the subject heading.',
  })),
  ...([['mathematics','Mathematics'],['physical-science','Physical Sciences']] as const).map(([subjectId,subjectName]) => ({
    id:`dbe-2025-may-june-${subjectId}`, year:2025, sitting:'May/June' as const, grade:12 as const,
    subjectId, subjectName, papers:['Paper 1','Paper 2'] as const, memos:['Memo 1','Memo 2'] as const,
    languages:['English','Afrikaans'] as const,
    sourceTitle:'2025 May/June NSC/SC Examination Papers',
    sourceUrl:'https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/2025MayJuneExamPapers.aspx',
    sourceAuthority:'Department of Basic Education' as const, sourceKind:'official-index-page' as const,
    verifiedAt:'2026-11-08' as const,
    accessNote:'The official DBE page lists English and Afrikaans papers and memos for this subject. Open the page and select the subject heading.',
  })),
  ...([['mathematics','Mathematics'],['physical-science','Physical Sciences']] as const).map(([subjectId,subjectName]) => ({
    id:`dbe-2024-nov-${subjectId}`, year:2024, sitting:'November' as const, grade:12 as const,
    subjectId, subjectName, papers:['Paper 1','Paper 2'] as const, memos:['Memo 1','Memo 2'] as const,
    languages:['English','Afrikaans'] as const,
    sourceTitle:'2024 November NSC Examination Papers',
    sourceUrl:'https://www.education.gov.za/2024NSCNovemberpastpapers.aspx',
    sourceAuthority:'Department of Basic Education' as const, sourceKind:'official-index-page' as const,
    verifiedAt:'2026-11-08' as const,
    accessNote:'The official DBE page lists English and Afrikaans papers and memos for this subject. Open the page and select the subject heading.',
  })),
]
