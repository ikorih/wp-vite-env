/**
 * blocks/spacer/index.jsx
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { useBlockProps } from '@wordpress/block-editor';

import './editor.css';
import './style.css';

const SIZES = [
  { label: '8px', value: 8 },
  { label: '24px', value: 24 },
  { label: '40px', value: 40 },
  { label: '64px', value: 64 },
  { label: '80px', value: 80 },
  { label: '120px', value: 120 },
  { label: '160px', value: 160 },
  { label: '200px', value: 200 },
];

registerBlockType('my-custom-block/spacer', {
  edit({ attributes, setAttributes }) {
    const { size } = attributes;
    const blockProps = useBlockProps();

    return (
      <>
        <InspectorControls>
          <PanelBody title={__('スペーサーの高さ', 'my-custom-block')} initialOpen>
            <SelectControl
              label={__('高さを選択', 'my-custom-block')}
              value={size}
              options={SIZES}
              onChange={(val) => setAttributes({ size: parseInt(val, 10) })}
            />
          </PanelBody>
        </InspectorControls>
        <div {...blockProps} className={`c-spacer -h-${size}`} />
      </>
    );
  },

  save({ attributes }) {
    const { size } = attributes;
    const blockProps = useBlockProps.save();
    return <div {...blockProps} className={`c-spacer -h-${size}`} />;
  },
});
