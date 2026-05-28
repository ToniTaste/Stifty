// cdoFieldAngleDropdown.js
(function (Blockly) {
    const { FieldDropdown } = Blockly;

    function customAngleValidator(newValue) {
        if (newValue === 'CUSTOM') {
            const entry = prompt('Bitte gib einen Winkel von 0° bis 360° ein:', '');
            if (entry === null) {
                return null;
            }
            let num = Math.round(Number(entry));
            if (isNaN(num)) {
                alert('Bitte gib eine Zahl zwischen 0 und 360 ein.');
                return null;
            }
            num = Math.min(360, Math.max(0, num));
            return String(num);
        }
        return newValue;
    }

    class CdoFieldAngleDropdown extends FieldDropdown {

        /** @override */
        initView() {
            super.initView();
            this.doValueUpdate_(this.value_);
        }

        doValueUpdate_(newValue) {
            this.value_ = newValue;
            if (this.textElement_) {
                this.textElement_.textContent = newValue + '°';
            }
            const block = this.getSourceBlock();
            if (block) {
                block.render();
            }
        }

        showEditor_() {
            super.showEditor_();

            const menuDiv = Blockly.DropDownDiv.getContentDiv();
            if (!menuDiv)
                return;
            const wrapper = document.createElement('div');
            wrapper.className = 'angle-dropdown-wrapper';
            const listContainer = document.createElement('div');
            listContainer.className = 'angle-list-container';
            const previewContainer = document.createElement('div');
            previewContainer.className = 'angle-preview-container';
            while (menuDiv.firstChild) {
                listContainer.appendChild(menuDiv.firstChild);
            }
            wrapper.appendChild(listContainer);
            wrapper.appendChild(previewContainer);
            menuDiv.appendChild(wrapper);
            Blockly.CdoAngleHelper.showAngleHelper(this, previewContainer);
            listContainer.addEventListener('mouseover', e => {
                const item = e.target.closest('[role="option"]');
                if (!item)
                    return;
                const m = item.textContent.trim().match(/^(\d+)(?:°)?/);
                const val = m ? parseInt(m[1], 10) : 0;
                previewContainer.innerHTML = '';
                Blockly.CdoAngleHelper.showAngleHelper(this, previewContainer, val);
            });
        }

        static fromJson(options) {
            const field = new CdoFieldAngleDropdown(options.options, customAngleValidator);
            if (options.value !== undefined) {
                field.setValue(options.value);
            }
            return field;
        }
    }

    Blockly.fieldRegistry.register('field_angle_dropdown', CdoFieldAngleDropdown);
})(Blockly);
