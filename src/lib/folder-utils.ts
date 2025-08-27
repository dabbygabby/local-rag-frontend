// Folder upload utilities for converting code files to markdown

export interface ProcessedFile {
  file: File;
  originalPath: string;
  convertedContent: string;
  language: string;
}

export interface FolderUploadStatus {
  originalPath: string;
  file: File;
  progress: number;
  status: "pending" | "processing" | "uploading" | "success" | "error";
  message?: string;
  language?: string;
}

// File extensions to language mapping for syntax highlighting
const LANGUAGE_MAP: Record<string, string> = {
  // JavaScript/TypeScript
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  
  // Python
  '.py': 'python',
  '.pyw': 'python',
  '.pyi': 'python',
  
  // Web technologies
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.vue': 'vue',
  
  // Configuration/Data
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.xml': 'xml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.cfg': 'ini',
  '.conf': 'ini',
  
  // Other languages
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.hpp': 'cpp',
  '.php': 'php',
  '.rb': 'ruby',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'zsh',
  '.fish': 'fish',
  '.ps1': 'powershell',
  '.bat': 'batch',
  '.cmd': 'batch',
  
  // Documentation
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.txt': 'text',
  '.log': 'text',
  '.csv': 'csv',
  
  // Docker/Infrastructure
  'dockerfile': 'dockerfile',
  '.dockerfile': 'dockerfile',
  '.dockerignore': 'text',
  '.gitignore': 'text',
  '.env': 'bash',
  '.env.example': 'bash',
  '.env.local': 'bash',
  '.env.production': 'bash',
  '.env.development': 'bash',
};

// Files and directories to ignore during folder upload
const IGNORE_PATTERNS = [
  // Version control
  '.git',
  '.svn',
  '.hg',
  
  // Dependencies
  'node_modules',
  'vendor',
  '__pycache__',
  '.pytest_cache',
  'venv',
  'env',
  '.venv',
  '.env',
  'virtualenv',
  
  // Build outputs
  'dist',
  'build',
  'out',
  'target',
  '.next',
  '.nuxt',
  '_site',
  'public/build',
  
  // IDE/Editor
  '.vscode',
  '.idea',
  '.vs',
  '*.swp',
  '*.swo',
  '*~',
  '.DS_Store',
  'Thumbs.db',
  
  // Logs
  '*.log',
  'logs',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  
  // OS
  '.Spotlight-V100',
  '.Trashes',
  'ehthumbs.db',
  'Desktop.ini',
  
  // Package files
  '*.tgz',
  '*.tar.gz',
  '*.zip',
  '*.rar',
  '*.7z',
  
  // Binary/Media (usually not useful for RAG)
  '*.exe',
  '*.dll',
  '*.so',
  '*.dylib',
  '*.img',
  '*.iso',
  '*.jpg',
  '*.jpeg',
  '*.png',
  '*.gif',
  '*.bmp',
  '*.svg',
  '*.ico',
  '*.mp3',
  '*.mp4',
  '*.avi',
  '*.mov',
  '*.wmv',
  '*.pdf',
  '*.doc',
  '*.docx',
  '*.xls',
  '*.xlsx',
  '*.ppt',
  '*.pptx',
];

/**
 * Check if a file or directory should be ignored
 */
export function shouldIgnoreFile(path: string): boolean {
  const filename = path.split('/').pop() || '';
  const directory = path.split('/').slice(-2)[0] || '';
  
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      // Handle glob patterns
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filename) || regex.test(directory);
    }
    
    // Exact match for filename or directory
    return filename === pattern || 
           directory === pattern || 
           path.includes(`/${pattern}/`) ||
           path.endsWith(`/${pattern}`);
  });
}

/**
 * Get the language identifier for syntax highlighting based on file extension
 */
export function getLanguageFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  if (!ext) return 'text';
  
  // Handle special cases
  if (filename.toLowerCase() === 'dockerfile') return 'dockerfile';
  if (filename.toLowerCase().includes('dockerfile')) return 'dockerfile';
  
  return LANGUAGE_MAP[`.${ext}`] || 'text';
}

/**
 * Convert a file's content to markdown format with syntax highlighting
 */
export async function convertFileToMarkdown(file: File, originalPath: string): Promise<ProcessedFile> {
  const content = await file.text();
  const language = getLanguageFromExtension(file.name);
  
  // Create markdown content with file header and code block
  const markdownContent = `# ${originalPath}

\`\`\`${language}
${content}
\`\`\`
`;

  return {
    file,
    originalPath,
    convertedContent: markdownContent,
    language
  };
}

/**
 * Create a new File object from converted markdown content
 */
export function createMarkdownFile(processedFile: ProcessedFile): File {
  // Convert path to safe filename: folder_a/folder_b/file.py -> folder_a_folder_b_file_py.md
  const safeFilename = processedFile.originalPath
    .replace(/\//g, '_')
    .replace(/\\/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/__+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    + '.md';
  
  const blob = new Blob([processedFile.convertedContent], { type: 'text/markdown' });
  
  // Use a more compatible approach for File creation
  try {
    return new (globalThis.File || File)([blob], safeFilename, { type: 'text/markdown' });
  } catch {
    // Fallback: create a File-like object
    const fileObj = Object.assign(blob, {
      name: safeFilename,
      lastModified: Date.now(),
    }) as File;
    return fileObj;
  }
}

/**
 * Process all files from a folder input recursively
 */
export async function processFolderFiles(
  fileList: FileList,
  onProgress?: (processed: number, total: number, currentFile: string) => void
): Promise<ProcessedFile[]> {
  const files = Array.from(fileList);
  const processedFiles: ProcessedFile[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = file.webkitRelativePath || file.name;
    
    // Skip ignored files
    if (shouldIgnoreFile(relativePath)) {
      continue;
    }
    
    // Skip empty files or very large files (>10MB)
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      continue;
    }
    
    try {
      onProgress?.(i, files.length, relativePath);
      
      const processedFile = await convertFileToMarkdown(file, relativePath);
      processedFiles.push(processedFile);
    } catch (error) {
      console.warn(`Failed to process file ${relativePath}:`, error);
      // Continue with other files
    }
  }
  
  return processedFiles;
}

/**
 * Get basic stats about the folder contents
 */
export function getFolderStats(fileList: FileList): {
  totalFiles: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  ignoredFiles: number;
} {
  const files = Array.from(fileList);
  const stats = {
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {} as Record<string, number>,
    ignoredFiles: 0
  };
  
  files.forEach(file => {
    const relativePath = file.webkitRelativePath || file.name;
    
    if (shouldIgnoreFile(relativePath)) {
      stats.ignoredFiles++;
      return;
    }
    
    stats.totalFiles++;
    stats.totalSize += file.size;
    
    const ext = file.name.split('.').pop()?.toLowerCase() || 'no-extension';
    stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
  });
  
  return stats;
}
