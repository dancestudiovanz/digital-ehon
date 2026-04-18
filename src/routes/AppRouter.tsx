import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import { EditorPage } from '../pages/EditorPage'
import { ViewerPage } from '../pages/ViewerPage'

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/editor/:bookId" element={<EditorPage />} />
      <Route path="/viewer/:bookId" element={<ViewerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
