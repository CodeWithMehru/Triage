export type ThreatType =
  | "SQL_INJECTION"
  | "XSS"
  | "SENSITIVE_DATA_LEAK";

export interface ThreatRule {
  type: ThreatType;
  name: string;
  pattern: RegExp;
}

export const THREAT_RULES: ThreatRule[] = [
  {
    type: "SQL_INJECTION",
    name: "or_1_equals_1",
    pattern: /('|\")?\s*or\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+/i,
  },
  {
    type: "SQL_INJECTION",
    name: "union_select",
    pattern: /union\s+(all\s+)?select/i,
  },
  {
    type: "SQL_INJECTION",
    name: "drop_table",
    pattern: /;\s*drop\s+table/i,
  },
  {
    type: "SQL_INJECTION",
    name: "xp_cmdshell",
    pattern: /xp_cmdshell/i,
  },
  {
    type: "SQL_INJECTION",
    name: "sql_comment",
    pattern: /(--|\/\*|\*\/|#)/,
  },
  {
    type: "SQL_INJECTION",
    name: "insert_into",
    pattern: /insert\s+into\s+\w+/i,
  },
  {
    type: "XSS",
    name: "script_tag",
    pattern: /<\s*script[\s>]/i,
  },
  {
    type: "XSS",
    name: "javascript_uri",
    pattern: /javascript\s*:/i,
  },
  {
    type: "XSS",
    name: "onerror_handler",
    pattern: /on(error|load|click|mouseover)\s*=/i,
  },
  {
    type: "XSS",
    name: "document_cookie",
    pattern: /document\.(cookie|write|location)/i,
  },
  {
    type: "XSS",
    name: "iframe_injection",
    pattern: /<\s*iframe/i,
  },
  {
    type: "SENSITIVE_DATA_LEAK",
    name: "openai_api_key",
    pattern: /sk-[a-zA-Z0-9]{20,}/,
  },
  {
    type: "SENSITIVE_DATA_LEAK",
    name: "aws_access_key",
    pattern: /AKIA[0-9A-Z]{16}/,
  },
  {
    type: "SENSITIVE_DATA_LEAK",
    name: "github_pat",
    pattern: /ghp_[a-zA-Z0-9]{36}/,
  },
  {
    type: "SENSITIVE_DATA_LEAK",
    name: "jwt_bearer",
    pattern: /Bearer\s+eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
  },
  {
    type: "SENSITIVE_DATA_LEAK",
    name: "anthropic_key",
    pattern: /sk-ant-[a-zA-Z0-9-]{20,}/,
  },
  {
    type: "SENSITIVE_DATA_LEAK",
    name: "generic_api_key",
    pattern: /api[_-]?key\s*[:=]\s*['\"]?[a-zA-Z0-9_-]{16,}/i,
  },
];

export interface ThreatMatch {
  type: ThreatType;
  ruleName: string;
  matchedText: string;
  surface: string;
}

export function scanSurface(
  surface: string,
  content: string
): ThreatMatch | null {
  if (!content || content.length === 0) return null;

  for (const rule of THREAT_RULES) {
    const match = rule.pattern.exec(content);
    if (match) {
      return {
        type: rule.type,
        ruleName: rule.name,
        matchedText: match[0].slice(0, 128),
        surface,
      };
    }
  }
  return null;
}
