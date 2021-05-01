import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Quill from 'quill';
import io from 'socket.io-client';
import 'quill/dist/quill.snow.css';
import 'components/TextEditor/styles.css';

const toolbarOptions = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ align: [] }],
  ['image', 'blockquote', 'code-block'],
  ['clean'],
];

const TextEditor = () => {
  const { id: documentId } = useParams();

  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  useEffect(() => {
    const socket = io('http://localhost:3001');

    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !quill) return;

    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== 'user') return;

      socket.emit('send-changes', delta);
    };

    quill.on('text-change', handleTextChange);

    return () => {
      quill.off('text-change', handleTextChange);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (!socket || !quill) return;

    const handleChangesReceive = (changes) => {
      quill.updateContents(changes);
    };

    socket.on('receive-changes', handleChangesReceive);

    return () => {
      socket.off('receive-change', handleChangesReceive);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (!socket || !quill) return;

    socket.once('load-document', (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit('get-document', documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (!socket || !quill) return;

    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents());
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (!wrapper) return;

    const editor = document.createElement('div');

    wrapper.innerHTML = '';
    wrapper.append(editor);

    const quill = new Quill(editor, {
      theme: 'snow',
      modules: {
        toolbar: toolbarOptions,
      },
    });

    quill.disable();
    quill.setText('Loading...');

    setQuill(quill);
  }, []);

  return (
    <div 
      className="text-editor" 
      ref={wrapperRef}  
    />
  );
};

export default TextEditor;
