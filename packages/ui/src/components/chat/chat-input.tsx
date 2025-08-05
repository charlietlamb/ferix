import {
  AIInput,
  AIInputButton,
  AIInputModelSelect,
  AIInputModelSelectContent,
  AIInputModelSelectItem,
  AIInputModelSelectTrigger,
  AIInputModelSelectValue,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from '@ferix/ui/components/kibo-ui/ai/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ferix/ui/components/shadcn/dropdown-menu';
import { cn } from '@ferix/ui/lib/utils';
import { FileIcon, GlobeIcon, MicIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEventHandler, useState } from 'react';
import { toast } from 'sonner';

const models = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai.com' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai.com' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai.com' },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic.com',
  },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic.com' },
  { id: 'palm-2', name: 'PaLM 2', provider: 'google.com' },
  { id: 'llama-2-70b', name: 'Llama 2 70B', provider: 'meta.com' },
  { id: 'llama-2-13b', name: 'Llama 2 13B', provider: 'meta.com' },
  { id: 'cohere-command', name: 'Command', provider: 'cohere.com' },
  { id: 'mistral-7b', name: 'Mistral 7B', provider: 'mistral.ai' },
];

export function ChatInput({
  status,
  sendMessage,
  selectedModel,
  onModelChange,
  className,
}: {
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  sendMessage: (message: string, model: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  className?: string;
}) {
  const [text, setText] = useState<string>('');
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [useMicrophone, setUseMicrophone] = useState<boolean>(false);
  const t = useTranslations('chat.input');

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (!text) {
      return;
    }
    sendMessage(text, selectedModel);
    setText('');
  };

  const handleFileAction = (action: string) => {
    toast.success('File action', {
      description: action,
    });
  };

  return (
    <div
      className={cn(
        'container sticky right-4 bottom-0 left-4 grid shrink-0 bg-gradient-to-t from-background via-50% via-background to-transparent pt-0',
        className
      )}
    >
      <div className="pointer-events-none absolute right-0 bottom-full left-0 h-8" />
      <AIInput className="my-2" onSubmit={handleSubmit}>
        <AIInputTextarea
          onChange={(event) => setText(event.target.value)}
          placeholder={t('placeholder')}
          value={text}
        />
        <AIInputToolbar>
          <AIInputTools>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <AIInputButton>
                  <PlusIcon size={16} />
                  <span className="sr-only">{t('actions.add-attachment')}</span>
                </AIInputButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => handleFileAction('upload-file')}
                >
                  <FileIcon className="mr-2" size={16} />
                  {t('actions.upload-file')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AIInputButton
              onClick={() => setUseMicrophone(!useMicrophone)}
              variant={useMicrophone ? 'default' : 'ghost'}
            >
              <MicIcon size={16} />
              <span className="sr-only">{t('actions.microphone')}</span>
            </AIInputButton>
            <AIInputButton
              onClick={() => setUseWebSearch(!useWebSearch)}
              variant={useWebSearch ? 'default' : 'ghost'}
            >
              <GlobeIcon size={16} />
              <span>{t('actions.search')}</span>
            </AIInputButton>
            <AIInputModelSelect
              onValueChange={onModelChange}
              value={selectedModel}
            >
              <AIInputModelSelectTrigger>
                <AIInputModelSelectValue />
              </AIInputModelSelectTrigger>
              <AIInputModelSelectContent>
                {models.map((aiModel) => (
                  <AIInputModelSelectItem key={aiModel.id} value={aiModel.id}>
                    {aiModel.name}
                  </AIInputModelSelectItem>
                ))}
              </AIInputModelSelectContent>
            </AIInputModelSelect>
          </AIInputTools>
          <AIInputSubmit disabled={!text} status={status} />
        </AIInputToolbar>
      </AIInput>
      <div className="h-4 bg-background" />
    </div>
  );
}
