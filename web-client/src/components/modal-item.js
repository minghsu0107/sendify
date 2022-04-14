import React, { useState } from 'react'
import { Modal } from 'reactstrap'
function ModalItem({ s3_url }) {
  const [modal, setModal] = useState(false)

  const toggle = () => {
    setModal(!modal)
  }

  return (
    <div class='myModal'>
      <a type='button' style={{ border: '0px' }}>
        <img src={s3_url} onClick={toggle} style={{ maxWidth: 250 + 'px', backgroundColor: '#fafbfb' }} />
      </a>
      <Modal isOpen={modal} toggle={toggle} centered class='modal fade' size='lg'>
        <div class='modal-dialog modal-dialog-centered modal-dialog-centered modal-dialog-scrollable'>
          <img src={s3_url} style={{ maxWidth: 'inherit' }} />
        </div>
      </Modal>
    </div>
  )
}

export default ModalItem
