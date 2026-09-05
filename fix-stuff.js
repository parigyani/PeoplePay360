const fs = require('fs');

const apiFiles = [
  "app/api/attendance/[id]/route.ts",
  "app/api/contracts/[id]/route.ts",
  "app/api/time-off/allocations/[id]/route.ts",
  "app/api/time-off/requests/[id]/approve/route.ts",
  "app/api/time-off/requests/[id]/refuse/route.ts",
  "app/api/time-off/requests/[id]/route.ts",
  "app/api/time-off/types/[id]/route.ts"
];

apiFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace { params }: { params: { id: string } } with Promise<{ id: string }>
  content = content.replace(/{ params }: { params: { id: string } }/g, '{ params }: { params: Promise<{ id: string }> }');
  
  // Insert const { id } = await params;
  content = content.replace(/export async function (GET|PUT|POST|DELETE)\(\s*request: Request,\s*\{ params \}: \{ params: Promise<\{ id: string \}> \}\s*\) \{/g, 
    "export async function $1(\n  request: Request,\n  { params }: { params: Promise<{ id: string }> }\n) {\n  const { id } = await params;");
    
  // Replace params.id with id
  content = content.replace(/params\.id/g, 'id');
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});

// Fix PDF Route
const pdfRoute = "app/api/payslips/[id]/pdf/route.ts";
if (fs.existsSync(pdfRoute)) {
  let pdfContent = fs.readFileSync(pdfRoute, 'utf8');
  pdfContent = pdfContent.replace(/return new NextResponse\(buffer, \{/g, 'return new NextResponse(new Uint8Array(buffer), {');
  fs.writeFileSync(pdfRoute, pdfContent);
  console.log(`Updated ${pdfRoute}`);
}

// Fix date-picker.tsx
const datePicker = "components/ui/date-picker.tsx";
if (fs.existsSync(datePicker)) {
  let dpContent = fs.readFileSync(datePicker, 'utf8');
  dpContent = dpContent.replace(/initialFocus/g, ''); // remove initialFocus
  fs.writeFileSync(datePicker, dpContent);
  console.log(`Updated ${datePicker}`);
}

// Fix RequestForm.tsx 
// No changes strictly needed in RequestForm if we add disabled to DatePicker props, but we actually need to add disabled to DatePickerProps.
// But DatePicker takes props differently. Let's see how date-picker.tsx is structured.
