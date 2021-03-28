// @vue/component
export const PopupHeader = {
  props: ['popupTitle'],
  template: `<div class="modal-header">
    <h5 class="modal-title">{{ popupTitle }}</h5>
    <button type="button" class="close popup_close_button" data-dismiss="modal" aria-label="Close">
    <span aria-hidden="true" class="close_button_symbol">&times;</span>
    </button>
    </div>`
}
