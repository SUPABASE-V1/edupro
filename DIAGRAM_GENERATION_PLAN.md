# Diagram Generation for Interactive Exams - Implementation Plan

## Problem
Students cannot answer questions that require visual aids (diagrams, charts, graphs, shapes) because:
1. Current system **blocks** diagram references with validation errors
2. No mechanism to generate or display visual content
3. Questions requiring diagrams are rejected or converted to text-only (incomplete)

## Solution
Implement **SVG-based diagram generation** using:
1. **generate_diagram** tool (AI generates SVG code)
2. **Inline SVG rendering** in ExamInteractiveView
3. **Question metadata** to attach diagrams to questions

## Implementation

### Phase 1: Add Diagram Tool to ai-proxy

#### 1.1 Add Tool Definition
Location: `supabase/functions/ai-proxy/index.ts` (around line 290)

```typescript
{
  name: 'generate_diagram',
  description: 'Generate SVG diagram for exam questions requiring visual aids (shapes, charts, graphs, number lines, etc.). Use this when a question needs a diagram to be answerable. Returns valid SVG code.',
  input_schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['shape', 'chart', 'graph', 'number_line', 'geometric', 'table', 'timeline', 'flowchart'],
        description: 'Type of diagram'
      },
      title: {
        type: 'string',
        description: 'Diagram title/caption'
      },
      data: {
        type: 'object',
        description: 'Data needed to generate the diagram (varies by type)',
        properties: {
          // For shapes
          shapes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['circle', 'rectangle', 'triangle', 'line'] },
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                radius: { type: 'number' },
                fill: { type: 'string' },
                label: { type: 'string' }
              }
            }
          },
          // For charts
          labels: { type: 'array', items: { type: 'string' } },
          values: { type: 'array', items: { type: 'number' } },
          // For number lines
          min: { type: 'number' },
          max: { type: 'number' },
          marked_values: { type: 'array', items: { type: 'number' } }
        }
      },
      width: {
        type: 'number',
        description: 'SVG width in pixels (default: 400)',
        default: 400
      },
      height: {
        type: 'number',
        description: 'SVG height in pixels (default: 300)',
        default: 300
      }
    },
    required: ['type', 'data']
  }
}
```

#### 1.2 Implement Tool Executor
Location: `supabase/functions/ai-proxy/index.ts` (around line 335)

```typescript
async function executeGenerateDiagramTool(
  input: any,
  context: ToolExecutionContext
): Promise<any> {
  console.log('[ai-proxy] Executing generate_diagram tool with input:', JSON.stringify(input, null, 2))
  
  try {
    const { type, title, data, width = 400, height = 300 } = input
    
    let svg = ''
    
    switch (type) {
      case 'chart':
        svg = generateChartSVG(data, width, height)
        break
      case 'number_line':
        svg = generateNumberLineSVG(data, width, height)
        break
      case 'shape':
        svg = generateShapesSVG(data, width, height)
        break
      case 'geometric':
        svg = generateGeometricSVG(data, width, height)
        break
      case 'table':
        svg = generateTableSVG(data, width, height)
        break
      default:
        svg = generateGenericDiagram(data, width, height)
    }
    
    // Wrap in full SVG tag
    const fullSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${title ? `<text x="${width/2}" y="20" text-anchor="middle" font-size="16" font-weight="bold">${title}</text>` : ''}
  ${svg}
</svg>`
    
    return {
      success: true,
      svg: fullSVG,
      type,
      title
    }
  } catch (error) {
    console.error('[ai-proxy] generate_diagram error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper: Generate bar chart
function generateChartSVG(data: any, width: number, height: number): string {
  const { labels, values } = data
  const barWidth = Math.floor((width - 80) / labels.length)
  const maxValue = Math.max(...values)
  const scale = (height - 80) / maxValue
  
  let svg = ''
  
  labels.forEach((label: string, i: number) => {
    const x = 40 + i * barWidth
    const barHeight = values[i] * scale
    const y = height - 40 - barHeight
    
    // Bar
    svg += `<rect x="${x}" y="${y}" width="${barWidth - 10}" height="${barHeight}" fill="#7c3aed" opacity="0.8"/>`
    
    // Value label
    svg += `<text x="${x + barWidth/2 - 5}" y="${y - 5}" font-size="12" font-weight="bold">${values[i]}</text>`
    
    // X-axis label
    svg += `<text x="${x + barWidth/2 - 5}" y="${height - 20}" font-size="11" text-anchor="middle">${label}</text>`
  })
  
  // Y-axis
  svg += `<line x1="35" y1="40" x2="35" y2="${height - 40}" stroke="#333" stroke-width="2"/>`
  // X-axis
  svg += `<line x1="35" y1="${height - 40}" x2="${width - 20}" y2="${height - 40}" stroke="#333" stroke-width="2"/>`
  
  return svg
}

// Helper: Generate number line
function generateNumberLineSVG(data: any, width: number, height: number): string {
  const { min, max, marked_values = [] } = data
  const range = max - min
  const scale = (width - 80) / range
  const yCenter = height / 2
  
  let svg = ''
  
  // Main line
  svg += `<line x1="40" y1="${yCenter}" x2="${width - 40}" y2="${yCenter}" stroke="#333" stroke-width="3"/>`
  
  // Tick marks and labels
  for (let val = min; val <= max; val++) {
    const x = 40 + (val - min) * scale
    svg += `<line x1="${x}" y1="${yCenter - 10}" x2="${x}" y2="${yCenter + 10}" stroke="#333" stroke-width="2"/>`
    svg += `<text x="${x}" y="${yCenter + 30}" font-size="12" text-anchor="middle">${val}</text>`
  }
  
  // Marked values (highlighted)
  marked_values.forEach((val: number) => {
    const x = 40 + (val - min) * scale
    svg += `<circle cx="${x}" cy="${yCenter}" r="8" fill="#ef4444"/>`
  })
  
  return svg
}

// Helper: Generate geometric shapes
function generateShapesSVG(data: any, width: number, height: number): string {
  const { shapes = [] } = data
  let svg = ''
  
  shapes.forEach((shape: any) => {
    const { type, x, y, width: w, height: h, radius, fill = '#7c3aed', label } = shape
    
    switch (type) {
      case 'circle':
        svg += `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" opacity="0.7" stroke="#333" stroke-width="2"/>`
        break
      case 'rectangle':
        svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" opacity="0.7" stroke="#333" stroke-width="2"/>`
        break
      case 'triangle':
        const points = `${x},${y + h} ${x + w/2},${y} ${x + w},${y + h}`
        svg += `<polygon points="${points}" fill="${fill}" opacity="0.7" stroke="#333" stroke-width="2"/>`
        break
    }
    
    if (label) {
      svg += `<text x="${x + (w || radius || 0)/2}" y="${y + (h || radius || 0)/2}" text-anchor="middle" font-size="14" font-weight="bold">${label}</text>`
    }
  })
  
  return svg
}

// Helper: Generate table as SVG
function generateTableSVG(data: any, width: number, height: number): string {
  const { headers = [], rows = [] } = data
  const cellWidth = (width - 40) / headers.length
  const cellHeight = 40
  let svg = ''
  
  // Headers
  headers.forEach((header: string, i: number) => {
    const x = 20 + i * cellWidth
    svg += `<rect x="${x}" y="20" width="${cellWidth}" height="${cellHeight}" fill="#7c3aed" stroke="#333" stroke-width="1"/>`
    svg += `<text x="${x + cellWidth/2}" y="45" text-anchor="middle" fill="white" font-weight="bold">${header}</text>`
  })
  
  // Rows
  rows.forEach((row: string[], rowIdx: number) => {
    const y = 20 + (rowIdx + 1) * cellHeight
    row.forEach((cell: string, colIdx: number) => {
      const x = 20 + colIdx * cellWidth
      svg += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="white" stroke="#333" stroke-width="1"/>`
      svg += `<text x="${x + cellWidth/2}" y="${y + 25}" text-anchor="middle">${cell}</text>`
    })
  })
  
  return svg
}

function generateGenericDiagram(data: any, width: number, height: number): string {
  return `<text x="${width/2}" y="${height/2}" text-anchor="middle" font-size="14">Diagram data: ${JSON.stringify(data)}</text>`
}
```

#### 1.3 Register Tool
Location: `supabase/functions/ai-proxy/index.ts` (around line 330)

```typescript
if (toolName === 'generate_diagram') {
  return await executeGenerateDiagramTool(toolInput, context)
}
```

### Phase 2: Update Exam Schema

#### 2.1 Update ParsedExam Interface
Location: `web/src/lib/examParser.ts`

```typescript
export interface ExamQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'numeric';
  marks: number;
  options?: string[];
  correctAnswer?: string;
  diagram?: {              // ← NEW
    svg: string;
    title?: string;
    type?: string;
  };
}
```

### Phase 3: Update ExamInteractiveView

#### 3.1 Render Diagrams
Location: `web/src/components/dashboard/exam-prep/ExamInteractiveView.tsx`

```typescript
const renderQuestion = (question: ExamQuestion, sectionIdx: number, qIdx: number) => {
  const qKey = `${sectionIdx}-${qIdx}`;
  const studentAnswer = answers[qKey] || '';
  const feedbackForQ = feedback[qKey];

  return (
    <div key={question.id} className="examQuestion">
      <div className="questionHeader">
        <span className="questionNumber">Question {qIdx + 1}</span>
        <span className="questionMarks">[{question.marks} marks]</span>
      </div>

      <div className="questionText">{question.text}</div>

      {/* NEW: Render diagram if present */}
      {question.diagram && (
        <div className="questionDiagram" style={{
          margin: '1rem 0',
          padding: '1rem',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          background: '#f9fafb',
          textAlign: 'center'
        }}>
          {question.diagram.title && (
            <div style={{ 
              fontWeight: 600, 
              marginBottom: '0.5rem',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {question.diagram.title}
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: question.diagram.svg }} />
        </div>
      )}

      {/* Rest of question rendering... */}
    </div>
  );
};
```

### Phase 4: Update Validation Rules

#### 4.1 Remove Diagram Blocking
Location: `supabase/functions/ai-proxy/index.ts` (line ~214 and ~1076)

**BEFORE:**
```typescript
description: '... NO diagram references.'
```

**AFTER:**
```typescript
description: '... If a question requires a diagram, use the generate_diagram tool to create one. The diagram will be attached to the question.'
```

**Update retry instruction (line ~1076):**
```typescript
'- If a question needs a visual aid, call generate_diagram first, then include the diagram in the question using the diagram property.',
'- Do NOT reference diagrams unless you generate them using the generate_diagram tool.',
```

## Benefits

### 1. Educational Value
- ✅ Students can answer geometry questions (shapes, angles)
- ✅ Data interpretation questions (bar charts, pie charts)
- ✅ Number line questions (fractions, decimals, operations)
- ✅ Timeline questions (history, sequencing)

### 2. CAPS Alignment
- ✅ Meets CAPS requirements for visual mathematics
- ✅ Supports Foundation Phase visual learning
- ✅ Enables data handling curriculum (Grades 1-12)

### 3. Technical
- ✅ Pure SVG (no external dependencies)
- ✅ Scalable and responsive
- ✅ Accessible (can add ARIA labels)
- ✅ Printable
- ✅ Works offline

## Example Questions Now Possible

### Before (BLOCKED):
```
❌ "Refer to the diagram. Which shape has the most sides?"
```

### After (GENERATED):
```typescript
{
  text: "Which shape has the most sides?",
  type: "multiple_choice",
  options: ["Circle", "Triangle", "Square", "Pentagon"],
  diagram: {
    svg: "<svg>...</svg>",  // Shows circle, triangle, square, pentagon
    title: "Shapes",
    type: "geometric"
  }
}
```

### More Examples:

**Number Line (Grade 1):**
```
"Look at the number line. What number is marked with a red circle?"
[Diagram shows 0-10 with circle on 7]
```

**Bar Chart (Grade 3):**
```
"According to the chart, which month had the most rainfall?"
[Diagram shows bar chart: Jan=120mm, Feb=150mm, Mar=180mm]
```

**Geometry (Grade 7):**
```
"Calculate the perimeter of the rectangle shown."
[Diagram shows rectangle labeled: length=8cm, width=5cm]
```

## Implementation Priority

**Phase 1 (HIGH PRIORITY):**
- [ ] Add generate_diagram tool definition
- [ ] Implement basic chart generator
- [ ] Implement number line generator
- [ ] Update exam schema to support diagrams

**Phase 2 (MEDIUM):**
- [ ] Update ExamInteractiveView to render diagrams
- [ ] Update validation to allow diagram generation
- [ ] Test with sample questions

**Phase 3 (LOW):**
- [ ] Add more diagram types (flowcharts, timelines)
- [ ] Add interactive diagrams (clickable, draggable)
- [ ] Add diagram export (PNG/PDF)

## Testing

```typescript
// Test diagram generation
const testDiagram = {
  type: 'chart',
  title: 'Monthly Sales',
  data: {
    labels: ['Jan', 'Feb', 'Mar'],
    values: [120, 150, 180]
  },
  width: 400,
  height: 300
}

// Should return valid SVG
```

## Files to Modify

1. `supabase/functions/ai-proxy/index.ts` - Add tool and generators
2. `web/src/lib/examParser.ts` - Update interfaces
3. `web/src/components/dashboard/exam-prep/ExamInteractiveView.tsx` - Render diagrams
4. `web/src/types/exam.ts` - Type definitions

---

**Start with Phase 1 to unblock visual question generation immediately!**
