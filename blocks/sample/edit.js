import { useBlockProps, RichText } from '@wordpress/block-editor';

/**
 * エディタ表示。render.php と同じクラスを出力し、
 * editor-style.css（Tailwind）で本番と近い見た目にする。
 */
export default function Edit({ attributes, setAttributes }) {
  const blockProps = useBlockProps({ className: 'c-sample' });

  return (
    <div {...blockProps}>
      <RichText
        tagName="h3"
        className="c-sample__title"
        value={attributes.title}
        onChange={(title) => setAttributes({ title })}
        placeholder="タイトルを入力…"
        allowedFormats={[]}
      />
    </div>
  );
}
