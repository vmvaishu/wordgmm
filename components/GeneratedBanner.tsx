
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const GeneratedBanner: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateBanner = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: 'A hyper-realistic cinematic entrance to a futuristic high-tech digital word vault, glowing neon cyan and indigo lines, floating holographic letter fragments, volumetric lighting, 16:9 aspect ratio, 4k resolution, dark atmosphere.',
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            setImageUrl(`data:image/png;base64,${base64EncodeString}`);
            break;
          }
        }
      } catch (error) {
        console.error("Failed to generate banner:", error);
      } finally {
        setLoading(false);
      }
    };

    generateBanner();
  }, []);

  return (
    <div className="w-full max-w-4xl aspect-video rounded-[2rem] sm:rounded-[3rem] overflow-hidden relative border border-white/10 shadow-2xl bg-slate-900/50">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">Establishing Neural Link...</span>
        </div>
      ) : imageUrl ? (
        <>
          <img src={imageUrl} alt="Vault Entrance" className="w-full h-full object-cover animate-in fade-in duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-80"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/40 via-transparent to-transparent"></div>
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
              <span className="text-[8px] font-black text-emerald-400 tracking-widest uppercase">Live Sector Feed</span>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
          <span className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Clearance Visual Offline</span>
        </div>
      )}
    </div>
  );
};

export default GeneratedBanner;
