import { VercelIcon } from '@/components/icons';
import { 
  OpenAI, 
  Anthropic, 
  Google, 
  Mistral,
  Meta,
  Groq
} from '@lobehub/icons';
import { Triangle } from 'lucide-react';

// Custom xAI icon component
const XAIIcon = ({ size = 18 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg" 
    className="size-4"
  >
    <path 
      d="M2.30047 8.77631L12.0474 23H16.3799L6.63183 8.77631H2.30047ZM6.6285 16.6762L2.29492 23H6.63072L8.79584 19.8387L6.6285 16.6762ZM17.3709 1L9.88007 11.9308L12.0474 15.0944L21.7067 1H17.3709ZM18.1555 7.76374V23H21.7067V2.5818L18.1555 7.76374Z" 
      fill="currentColor"
    />
  </svg>
);

// Map provider IDs to their corresponding icons
export const providerIcons: Record<string, React.ComponentType<any>> = {
  openai: OpenAI,
  anthropic: Anthropic,
  google: Google,
  mistral: Mistral,
  togetherai: Meta, // Using Meta icon for Together.ai since they host Llama models
  groq: Groq,
  xai: XAIIcon, // Using custom xAI icon
  vercel: VercelIcon,
};

// Helper function to get icon component for a provider
export const getProviderIcon = (providerId: string, size: number = 18) => {
  const IconComponent = providerIcons[providerId];
  if (!IconComponent) {
    return null;
  }
  return <IconComponent size={size} />;
};
