import "./style.scss"
import * as pdfjsLib from "pdfjs-dist";
import { GoogleGenAI } from "@google/genai";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
const ai = new GoogleGenAI({ apiKey: "AIzaSyBwi13J4YRsrxpNGGKDaNQhT7SZrE9CyqA" });

const button=document.querySelector(".button");
const pdfInput = document.getElementById("pdfInput") as HTMLInputElement;

let pdfFile: File | null = null;
let textPdf:string|null=null;




pdfInput.addEventListener("change", (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    button?.removeAttribute("disabled")
    pdfFile = file;
    button?.addEventListener('click', () => {
    const boxInput = document.querySelector(".boxInput") as HTMLElement | null;
    if (boxInput) {
    boxInput.style.display = "none";
    setTimeout(()=>{
      (document.querySelector(".result") as HTMLElement).style.display="block"
    },1500)
    } 
    if (pdfFile) {
      extractTextFromPDF(pdfFile);
      } 
    });
    }
});

async function extractTextFromPDF(file: File) {
  try {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;

    let textContent = '';
    
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const text = await page.getTextContent();
  
      textContent += text.items.map((item: any) => item.str).join(' ') + '\n';
    }
    textPdf = `
You are an experienced HR professional.

I will give you a CV as raw text.

If the file is NOT a CV, reply with exactly one sentence: "This file must be a CV." — no other text.

If it IS a CV, analyze it and respond using the exact following structure in English. Your answer should only include plain lines with no symbols (no stars, bullets, dashes, or numbers). Each point should be in a new line so I can format it myself in my website.

Structure:
Overall Rating (out of 10): (number here)

Strengths:
[Write each strength in a new line]

Weaknesses Areas for Improvement:
[Write each weakness in a new line]

Suggestions for Improvement:
[Write each suggestion in a new line]

Do not include any introductions or conclusions. Keep the format consistent every time.

Now analyze this CV:
${textContent}

    `;
    
    await main();

  } catch (error) {
    console.error("Error extracting text from PDF:", error);
  }
}






async function main() {
  const loader = document.querySelector(".loader") as HTMLElement;
  loader.style.display = "block"; 

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `${textPdf}`,
    });
{
  resultDiv(response.text);

}
  } catch (err) {
    resultDiv("Error");
  } finally {
    loader.style.display = "none"; 
  }
}




function splitResponse(response: string | undefined): {
  rating: string,
  strengths: string,
  weaknesses: string,
  suggestions: string
} {
  if (!response) {
    return {
      rating: "No rating found.",
      strengths: "No strengths found.",
      weaknesses: "No weaknesses found.",
      suggestions: "No suggestions found."
    };
  }

  let ratingMatch = response.match(/Overall Rating.*?\n/);
  let strengthsMatch = response.match(/Strengths:(.*?)Weaknesses/s);
  let weaknessesMatch = response.match(/Weaknesses.*?:(.*?)(Suggestions|$)/s);
  let suggestionsMatch = response.match(/Suggestions.*?:([\s\S]*)/);

  return {
    rating: ratingMatch?.[0].trim() || "No rating found.",
    strengths: strengthsMatch?.[1].trim() || "No strengths found.",
    weaknesses: weaknessesMatch?.[1].trim() || "No weaknesses found.",
    suggestions: suggestionsMatch?.[1].trim() || "No suggestions found.",
  };
}


function resultDiv(response: string | undefined): void {
  const result = document.querySelector(".result") as HTMLElement;
  const { rating, strengths, weaknesses, suggestions } = splitResponse(response);

  const toList = (text: string): string => {
    const items = text.split(/[\n•\-]+/).map(item => item.trim()).filter(item => item.length > 0);
    return `<ul>${items.map(item => `<li>${item}</li>`).join("")}</ul>`;
  };

  result.innerHTML = `
  <div class="box collapse rating">
    <div class="toggle-header">Overall Rating:<i class="fa-solid fa-angle-down"></i></div>
    <div class="collapse-content">${rating}</div>
  </div>
  <div class="box collapse strengths">
    <div class="toggle-header">Strengths:
    <i class="fa-solid fa-angle-down"></i></div>
    <div class="collapse-content">${toList(strengths)}</div>
  </div>
  <div class="box collapse weaknesses">
    <div class="toggle-header">Weaknesses:<i class="fa-solid fa-angle-down"></i></div>
    <div class="collapse-content">${toList(weaknesses)}</div>
  </div>
  <div class="box collapse suggestions">
    <div class="toggle-header">Suggestions for Improvement:<i class="fa-solid fa-angle-down"></i></div>
    <div class="collapse-content">${toList(suggestions)}</div>
  </div>
`;

const toggleHeaders = document.querySelectorAll('.toggle-header');
toggleHeaders.forEach(header => {
  const content = header.nextElementSibling as HTMLElement;

  content.style.display = 'block'; 
  header.addEventListener('click', () => {
    const currentDisplay = window.getComputedStyle(content).display;
    if (currentDisplay === 'block') {
      content.style.display = 'none';
    } else {
      content.style.display = 'block';
    }
  });
});



}


