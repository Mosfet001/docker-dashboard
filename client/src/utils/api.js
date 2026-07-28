import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach JWT from localStorage on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('dd_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Redirect to login on 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dd_token')
      window.location.hash = '#/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Convenience helpers
export const containers = {
  list:    ()       => api.get('/containers'),
  inspect: (id)     => api.get(`/containers/${id}/inspect`),
  logs:    (id, n)  => api.get(`/containers/${id}/logs?tail=${n ?? 100}`),
  stats:   (id)     => api.get(`/containers/${id}/stats`),
  start:   (id)     => api.post(`/containers/${id}/start`),
  stop:    (id)     => api.post(`/containers/${id}/stop`),
  restart: (id)     => api.post(`/containers/${id}/restart`),
  remove:  (id, f)  => api.delete(`/containers/${id}?force=${f ?? false}`),
  create:  (body)   => api.post('/containers', body),
}

export const images = {
  list:   ()    => api.get('/images'),
  pull:   (img) => api.post('/images/pull', { image: img }),
  remove: (id)  => api.delete(`/images/${id}`),
  prune:  ()    => api.post('/images/prune'),
}

export const volumes = {
  list:   ()     => api.get('/volumes'),
  create: (body) => api.post('/volumes', body),
  remove: (name) => api.delete(`/volumes/${name}`),
  prune:  ()     => api.post('/volumes/prune'),
}

export const networks = {
  list:   ()     => api.get('/networks'),
  create: (body) => api.post('/networks', body),
  remove: (id)   => api.delete(`/networks/${id}`),
  prune:  ()     => api.post('/networks/prune'),
}

export const system = {
  info:    () => api.get('/system/info'),
  df:      () => api.get('/system/df'),
  version: () => api.get('/system/version'),
  prune:   () => api.post('/system/prune'),
}

export const auth = {
  login:  (u, p) => api.post('/auth/login', { username: u, password: p }),
  logout: ()     => api.post('/auth/logout'),
  me:     ()     => api.get('/auth/me'),
}
