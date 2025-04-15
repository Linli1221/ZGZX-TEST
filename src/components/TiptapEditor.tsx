'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  placeholder = '开始输入您的内容...',
  readOnly = false,
  autoFocus = false,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({
        limit: 50000,
      }),
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !readOnly,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none',
        'data-placeholder': placeholder,
      },
    },
  });

  // 确保只在客户端渲染
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="border rounded p-4 min-h-[200px] bg-gray-50">加载编辑器...</div>;
  }

  return (
    <div className="tiptap-editor-wrapper">
      <EditorContent editor={editor} className="min-h-[200px] border rounded p-4 bg-white" />
      {!readOnly && (
        <div className="text-right text-sm text-gray-500 mt-2">
          {editor?.storage.characterCount.characters() || 0} 字
        </div>
      )}
    </div>
  );
};

export default TiptapEditor; 