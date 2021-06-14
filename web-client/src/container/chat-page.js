import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import socketIOClient from 'socket.io-client'
import SidebarItem from 'components/sidebar-item'
import ChatItem from 'components/chat-item'
import 'index.css'
import axios from 'axios'

function ChatPage({ user, logout }) {
  const chatContentDom = useRef(null)
  const [message, setMessage] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [currentChannel, setCurrentChannel] = useState({
    name: '',
    members: [],
  })
  const [socket, setSocket] = useState(
    socketIOClient('/sendify', {
      extraHeaders: {
        Authorization: `bearer ${user.accessToken}`,
        'X-User-Id': user.userId,
        'X-Username': user.firstname || 'Unknown',
      },
      autoConnect: false,
    })
  )

  useEffect(() => {
    socket.open()
    socket.on('message', (data) => {
      console.log({ message: data })
      setMessage((prev) => [...prev, data])
      chatContentDom.current.scrollTo({
        top: chatContentDom.current.scrollHeight,
        left: 0,
        behavior: 'smooth',
      })
    })
    socket.on('roomData', (data) => {
      console.log({ roomData: data })
      setCurrentChannel({
        name: data.room,
        members: data.users,
      })
    })
    // for test
    setCurrentChannel({
      name: 'ntuim',
      members: [],
    })

    return () => socket.disconnect()
  }, [])

  useEffect(() => {
    if (currentChannel.name !== '') {
      console.log({ room: currentChannel.name })
      socket.emit('join', { room: currentChannel.name }, (error) => {
        if (error) {
          console.log(error)
          alert(error)
        }
      })
      setMessage([])
    }
  }, [user.name, currentChannel.name])

  const handleInputKeyPress = (e) => {
    if (e.target.value !== '' && e.key === 'Enter') {
      const username = user.firstname
      console.log({ username, room: currentChannel.name, message: e.target.value })
      socket.emit('sendMessage', { message: e.target.value, room: currentChannel.name }, (error) => {
        if (error) {
          console.log(error)
          alert('fail to send message')
        }
      })
      setNewMsg('')
    }
  }

  const handleUploadKeyDown = (file) => {
    if (file !== '') {

      // Get channel id
      let cid = 0;
      axios
        .get('/api/channels')
        .then(async (res) => {
          alert(res.status)
          console.log(res);
          let c = res.data.channels;
          for (let i = 0; i < c.channels.length; i++)
            if (c[i]["name"] === currentChannel.name)
              cid = c[i]["id"];
        })
        .catch((err) => {
          console.log(err)
          alert('Cannot get channel-id')
        })

      cid = 10; // TODO for test
      if (cid !== 0) {
        const data = new FormData();
        data.append('file', file);
        // for (var key of data.entries()) {
        //   console.log(key[0] + ', ' + key[1]);
        // }
        axios
          .post('https://sendify-beta.csie.org/upload', data, { headers: { "Authorization": `bearer ${user.accessToken}`, "X-Channel-Id": currentChannel.id, "Content-Type": "multipart/form-data" } })
          .then(async (res) => {
            alert(res.status)
            console.log(res)

            // TODO call sendMsg
            // text type s3_url filesize createdAt username
            const username = user.firstname
            const filesize = res.data.size // TODO
            console.log({ message: { s3_url: res.data.s3_url, type: res.data.type, text: res.data.orginal_filename, filesize: filesize }, room: currentChannel.name })
            socket.emit('sendMessage', { message: { s3_url: res.data.s3_url, type: res.data.type, text: res.data.orginal_filename, filesize: filesize }, room: currentChannel.name }, (error) => {
              if (error) {
                console.log(error)
                alert('fail to send message')
              }
            })
          })
          .catch((err) => {
            console.log(err)
            alert('Something wrong occurs')
          })
      }
    }
  }

  return (
    <div id='app'>
      <div id='sidebar' class='active'>
        <div class='sidebar-wrapper active'>
          <div class='sidebar-header'>
            <div class='d-flex justify-content-between'>
              <div class='logo'>
                <Link to='/'>
                  <img src='assets/images/logo/logo.png' alt='Logo' width='100' height='100' />
                </Link>
              </div>
              <div class='toggler d-sm-none'>
                <a href='#' class='sidebar-hide d-xl-none d-block'>
                  <i class='bi bi-x bi-middle'></i>
                </a>
              </div>
            </div>
          </div>

          <div class='sidebar-menu'>
            <ul class='menu'>
              {/* <li class='sidebar-title'>Pinned Channels</li>

              <li class='sidebar-item'>
                <a href='index.html' class='sidebar-link'>
                  <span># ntuim</span>
                </a>
              </li> */}

              <li class='sidebar-title'>All Channels</li>
              {/* TODO */}
              <SidebarItem text='ntuim' onClick={() => setCurrentChannel({ members: [], name: 'ntuim' })} />
              <SidebarItem text='family' onClick={() => setCurrentChannel({ members: [], name: 'family' })} />
              <SidebarItem text='wendy' onClick={() => setCurrentChannel({ members: [], name: 'wendy' })} />
            </ul>
          </div>
          <button class='sidebar-toggler btn x'>
            <i data-feather='x'></i>
          </button>
          <Link to='/'>
            <button class='btn btn-blue' onClick={logout}>
              Logout
            </button>
          </Link>
        </div>
      </div>
      <div id='main'>
        <header class='mb-3'>
          <a href='#' class='burger-btn d-block d-xl-none'>
            <i class='bi bi-justify fs-3'></i>
          </a>
        </header>

        <div class='page-heading'>
          <section class='section'>
            <div class='row'>
              <div class='col-md-12'>
                <div class='card' style={{ maxHeight: '80vh' }}>
                  <div class='card-header'>
                    <div class='media d-flex align-items-center'>
                      <div class='avatar me-3'>
                        <img src='assets/images/samples/banana.jpg' alt='' />
                      </div>
                      <div class='name flex-grow-1'>
                        <h6 class='mb-0'># {currentChannel.name}</h6>
                        <span class='text-xs'>
                          {currentChannel.members.map((e, idx) => {
                            if (idx === currentChannel.members.length - 1) return e.username
                            else if (idx === currentChannel.members.length - 2) return e.username + ', and '
                            else return e.username + ', '
                          })}
                        </span>
                      </div>
                      <button class='btn btn-sm'>
                        <i data-feather='x'></i>
                      </button>
                    </div>
                  </div>
                  <div class='card-body pt-4 bg-grey' style={{ overflow: 'auto' }} ref={chatContentDom}>
                    <div class='chat-content'>
                      {message.map((el) => (
                        <ChatItem
                          text={el.text} // {filename if img,file}
                          type={el.type} // TODO {text,img,file}
                          s3_url={el.s3_url} // TODO text -> None
                          filesize={el.filesize} // TODO text,img -> None
                          time={Date(el.createdAt)}
                          sender={el.username}
                          left={parseInt(el.userId) !== parseInt(user.userId)}
                        />
                      ))}
                    </div>
                  </div>
                  <div class='card-footer'>
                    <div class='d-flex flex-grow-1 ml-4'>
                      <input
                        type='text'
                        class='form-control'
                        placeholder='Type your message..'
                        value={newMsg}
                        onKeyPress={handleInputKeyPress}
                        onChange={(e) => setNewMsg(e.target.value)}
                      />
                      <label for='file-upload' class='custom-file-upload'>
                        <i class='bi bi-paperclip'></i>
                      </label>
                      <input
                        id='file-upload'
                        type='file'
                        // onClick={(e) => e.target.value = ''}
                        onChange={(e) => handleUploadKeyDown(e.target.files[0])}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer>
            <div class='footer clearfix mb-0 text-muted'>
              <div class='float-start'>
                <p>2021 &copy; Sendify</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default ChatPage
