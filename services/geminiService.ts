
import { GoogleGenAI } from "@google/genai";
import { InvoiceData, ContractType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateContractText = async (data: InvoiceData): Promise<string> => {
    const { from, to, contractDetails } = data;
    const providerName = from.isBusiness ? from.businessName : from.name;
    const clientName = to.isBusiness ? to.businessName : to.name;
    
    let specificInstructions = '';
    switch (contractDetails.contractType) {
        case ContractType.NDA:
            specificInstructions = `
        **NDA-SPECIFIC INSTRUCTIONS:**
        - The primary focus MUST be the "Confidentiality" section. Make it robust and detailed.
        - Clearly define what constitutes "Confidential Information" (including oral, written, electronic forms) and what is excluded (e.g., publicly known information, independently developed information).
        - Detail the obligations of the Receiving Party:
          - Use the information ONLY for the specified "Purpose" (defined in the Scope of Work).
          - Do not disclose to any third party without prior written consent.
          - Implement reasonable security measures to protect the information.
        - Specify the process for the return or destruction of all confidential materials upon termination of the agreement or at the Disclosing Party's request.
        - Frame the "Scope of Work" as the "Purpose" for the disclosure (e.g., "To evaluate a potential business relationship").
        - Explicitly state the "Remedies for Breach," clarifying that the Disclosing Party is entitled to seek not only injunctive relief but also monetary damages.
      `;
            break;
        case ContractType.Service:
            specificInstructions = `
        **SERVICE AGREEMENT-SPECIFIC INSTRUCTIONS:**
        - In the "Scope of Services" section, be highly detailed based on the user's input to create a clear Statement of Work (SOW).
        - Include a clause on "Intellectual Property Rights" that clarifies who owns the final work product and any pre-existing IP.
        - Ensure "Payment Terms" are clearly linked to specific deliverables or project milestones.
        - Add a "Change Control" clause that outlines the formal process for any scope changes, including impact on cost and timeline. Also include a "Client Responsibilities" section (e.g., providing timely feedback, assets) and define "Acceptance Criteria" for deliverables to ensure clarity.
      `;
            break;
        case ContractType.Lease:
            specificInstructions = `
        **LEASE AGREEMENT-SPECIFIC INSTRUCTIONS:**
        - Clearly describe the leased property in the "Scope of Work" section (referred to as "Premises").
        - Create distinct sections for "Rent," "Security Deposit," and "Use of Premises."
        - Include sections covering "Landlord's Responsibilities" (e.g., structural repairs) and "Tenant's Responsibilities" (e.g., routine maintenance, utilities) regarding the property.
        - Include a "Subletting" clause that clearly states whether the tenant is permitted to sublet the property and under what specific conditions.
        - Add a "Landlord's Access" clause detailing the notice period required before the landlord can enter the property for inspections, repairs, or showings.
      `;
            break;
    }


    const prompt = `
      As an expert legal AI, generate a professional ${contractDetails.contractType} by populating a template with the specific details provided below.
      The tone must be formal, clear, and legally sound. Structure the document with numbered sections for clarity.
      Seamlessly integrate all provided details, replacing placeholders like "[List of services]" with the specified information.
      The final output must be a complete document body in plain text, ending with the 'Entire Agreement' clause. Do NOT generate a signature block.

      **PARTIES:**
      - Provider/Discloser/Landlord: ${providerName} (Address: ${from.address}, Email: ${from.email})
      - Client/Recipient/Tenant: ${clientName} (Address: ${to.address}, Email: ${to.email})

      **AGREEMENT DETAILS TO POPULATE:**
      - Effective Start Date: ${contractDetails.startDate}
      - Scope of Services/Work/Purpose/Premises: ${contractDetails.scopeOfWork}
      - Payment Terms / Rent: ${contractDetails.paymentTerms}
      - Governing Law & Jurisdiction: ${contractDetails.jurisdiction}
      - Agreement Term Length: ${contractDetails.termLength}
      - Termination Clause: ${contractDetails.terminationClauseDetails}
      - Indemnification Clause: ${contractDetails.indemnification}

      **GENERAL INSTRUCTIONS:**
      1.  Start with a clear, bold title: "${contractDetails.contractType.toUpperCase()}".
      2.  Define the parties involved using the appropriate roles (e.g., Provider/Client, Discloser/Recipient, Landlord/Tenant).
      3.  Use the details above to create comprehensive sections for "Scope of Services," "Payment Terms," "Term and Termination," "Indemnification," and "Governing Law."
      4.  Adhere strictly to the contract-specific instructions provided below to ensure the document is tailored and robust.
      5.  Include a standard "Confidentiality" clause. For an NDA, this section is the most critical part of the document and must be highly detailed as per the specific instructions. For other contract types, it should be a standard, appropriate clause.
      6.  Conclude with a statement confirming this document represents the entire agreement between the parties.
      
      ${specificInstructions}

      Generate the full, populated contract text now.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });

        if (response.text) {
          return response.text;
        } else {
          throw new Error("No text returned from Gemini API");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate contract from AI service.");
    }
};

export const refineContractText = async (currentText: string, refinementRequest: string): Promise<string> => {
    const prompt = `
      As an expert legal AI assistant, your task is to refine an existing legal document based on a user's specific request.
      Carefully review the **EXISTING CONTRACT TEXT** and apply the changes described in the **USER'S REFINEMENT REQUEST**.

      **RULES:**
      - ONLY return the full, updated contract text.
      - DO NOT add any explanations, apologies, or introductory/concluding remarks.
      - Ensure the refined contract maintains a professional and legally sound tone.
      - Seamlessly integrate the requested changes while preserving the rest of the contract's structure and content.

      **USER'S REFINEMENT REQUEST:**
      "${refinementRequest}"

      **EXISTING CONTRACT TEXT:**
      ---
      ${currentText}
      ---

      Now, provide the complete and refined contract text below.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });

        if (response.text) {
          return response.text;
        } else {
          throw new Error("No text returned from Gemini API during refinement.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for refinement:", error);
        throw new Error("Failed to refine contract from AI service.");
    }
};

export const generateTermsText = async (prompt: string): Promise<string> => {
    const fullPrompt = `
      As an expert legal AI, generate a standard "Terms & Conditions" clause for an invoice based on the following key points.
      The clause should be concise, professional, and suitable for a general-purpose invoice.
      Do not include a title like "Terms & Conditions". Only return the clause text itself.

      Key points from user: "${prompt}"

      Generate the clause now.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: fullPrompt,
        });
        if (response.text) {
          return response.text;
        } else {
          throw new Error("No text returned from Gemini API for T&C.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for T&C:", error);
        throw new Error("Failed to generate T&C from AI service.");
    }
};
