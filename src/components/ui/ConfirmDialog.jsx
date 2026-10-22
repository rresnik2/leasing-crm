import { useRef } from 'react';

import Button from './Button';
import Modal from './Modal';

// Confirmation prompt built on Modal. Focus starts on Cancel so that pressing Enter or
// Space right after it opens never performs the (often destructive) action. Extra props
// (className, ...) are passed to Modal.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  ...rest
}) {
  const cancelRef = useRef(null);

  return (
    <Modal
      {...rest}
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'primary' ? 'primary' : 'danger'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
