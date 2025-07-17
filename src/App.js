import React, { useState, useEffect, createContext, useContext, useRef } from 'react';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider, // Importar GoogleAuthProvider
  signInWithPopup // Importar signInWithPopup
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  orderBy, // Necesario para ordenar mensajes y reseñas
  limit,   // Para limitar mensajes
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage'; // Importaciones para Firebase Storage

// Contexto para Firebase y usuario
const FirebaseContext = createContext(null);

// Lista de ciudades de Nicaragua (duplicados eliminados)
const nicaraguanCities = [
  "Managua", "León", "Masaya", "Estelí", "Matagalpa", "Chinandega", "Granada",
  "Jinotega", "Nueva Guinea", "Puerto Cabezas", "Juigalpa", "Rivas", "Ocotal",
  "Jalapa",
  "San Carlos", "Bluefields", "Somoto", "Boaco", "Siuna", "Bonanza", "Rosita",
  "Camoapa", "Nagarote", "Diriamba", "Jinotepe", "San Marcos", "Catarina",
  "Niquinohomo", "Masatepe", "La Paz Centro", "Malpaisillo", "Tipitapa", "Ciudad Sandino",
  "El Rama", "Corinto", "El Viejo",
  "La Trinidad", "Condega", "Palacagüina", "San Juan del Sur", "Tola", "Belén",
  "Potosí", "Moyogalpa", "Altagracia", "San Jorge", "Cárdenas", "San Rafael del Sur",
  "Villa El Carmen", "El Crucero", "Ticuantepe", "La Concha", "San Juan de Limay",
  "Pueblo Nuevo", "Murra", "Quilalí", "Wiwilí de Jinotega", "San Sebastián de Yalí",
  "La Concordia", "San Rafael del Norte", "Santa María de Pantasma", "El Cuá",
  "San José de Bocay", "Waslala", "Rancho Grande", "Río Blanco", "Mulukukú",
  "Prinzapolka", "Waspán", "Desembocadura de Río Grande",
  "Corn Island", "Pearl Lagoon", "Kukra Hill", "Laguna de Perlas", "Bocana de Paiwas",
  "Santo Domingo", "La Libertad", "San Pedro de Lóvago", "Teustepe", "Santa Lucía",
  "San Lorenzo", "Comalapa", "Cuapa", "San Francisco de Cuapa", "Acoyapa",
  "El Coral", "Morrito", "San Miguelito", "El Castillo", "Solentiname",
  "San Juan de Nicaragua", "San Francisco Libre", "Ciudad Darío", "Terrabona",
  "Esquipulas", "San Isidro", "Sébaco", "San Ramón", "Muy Muy", "La Dalia", "El Tuma - La Dalia",
  "San Dionisio", "San Nicolás", "Santa Rosa del Peñón", "El Sauce", "Achuapa",
  "Larreynaga", "El Jicaral", "Santa Teresa", "Dolores", "San Gregorio", "La Conquista",
  "Nandaime", "Tisma", "Malacatoya",
  "San Juan de Oriente", "La Concepción", "Villa Carlos Fonseca"
];

// Lista de categorías de productos
const productCategories = [
  "Electrónica", "Vehículos", "Motocicletas", "Moda", "Hogar", "Servicios", "Inmuebles",
  "Deportes", "Libros y Revistas", "Mascotas", "Arte y Coleccionables",
  "Juguetes y Juegos", "Música y Películas", "Herramientas", "Otros"
];

// Componente para mostrar mensajes/notificaciones al usuario
const MessageBox = ({ message, type, onClose }) => {
  if (!message) return null; // No renderizar si no hay mensaje
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500'; // Color de fondo según el tipo
  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${bgColor} z-50`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">X</button> {/* Botón para cerrar */}
    </div>
  );
};

// Componente del formulario de autenticación (Registro/Inicio de Sesión)
const AuthForm = ({ onAuthAction, isRegistering, onClose, showSimulatedNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localName, setLocalName] = useState(''); // Estado local para el nombre en registro
  const [localLocation, setLocalLocation] = useState(''); // Estado local para la ubicación en registro
  const [localRole, setLocalRole] = useState('buyer'); // Estado local para el rol en registro

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pasar los estados locales si es registro, de lo contrario, vacíos
    onAuthAction(email, password, isRegistering ? localName : '', isRegistering ? localLocation : '', isRegistering ? localRole : 'buyer');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96 max-w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {isRegistering && (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={localName} // Usar estado local
                  onChange={(e) => setLocalName(e.target.value)} // Actualizar estado local
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                  Ubicación
                </label>
                <input
                  type="text"
                  id="location"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={localLocation} // Usar estado local
                  onChange={(e) => setLocalLocation(e.target.value)} // Actualizar estado local
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  Rol
                </label>
                <select
                  id="role"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={localRole} // Usar estado local
                  onChange={(e) => setLocalRole(e.target.value)} // Actualizar estado local
                >
                  <option value="buyer">Comprador</option>
                  <option value="seller">Vendedor</option>
                </select>
              </div>
            </>
          )}
          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
            >
              {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
            <button
              type="button"
              onClick={() => onClose()} // Cerrar el formulario y cambiar el modo
              className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
            >
              {isRegistering ? 'Ya tengo una cuenta' : 'Crear una cuenta'}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => showSimulatedNotification("Google Sign-In simulado", "info")} // Simular Google Sign-In
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 w-full flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.017-6.806 5.017-4.119 0-7.43-3.328-7.43-7.464 0-4.137 3.311-7.465 7.43-7.465 2.227 0 3.765.949 4.65 1.836l3.141-3.141c-1.705-1.607-3.98-2.607-7.791-2.607C6.012 2.525 2 6.538 2 11.525c0 4.987 4.012 9 10.24 9 5.736 0 9.42-4.147 9.42-8.795 0-.668-.073-1.3-.18-1.91z"/>
            </svg>
            Iniciar sesión con Google
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

// Componente para la vista del perfil del usuario
const ProfileView = ({ user, db, appId, storage, userProfile, setUserProfile, editingProfile, setEditingProfile, name, setName, location, setLocation, photoURL, setPhotoURL, role, setRole, selectedFile, setSelectedFile, uploadingPhoto, setUploadingPhoto, showSimulatedNotification }) => {
  if (!userProfile) return null; // No renderizar si no hay perfil

  const [receivedReviews, setReceivedReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  // Efecto para obtener las reseñas recibidas por el usuario actual
  useEffect(() => {
    if (!db || !user || !appId) return;

    const reviewsCollectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/reviews`);
    const q = query(reviewsCollectionRef, orderBy('timestamp', 'desc')); // Ordenar por fecha descendente

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReceivedReviews(reviewsList);

      if (reviewsList.length > 0) {
        const totalRating = reviewsList.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating((totalRating / reviewsList.length).toFixed(1)); // Calcular promedio
      } else {
        setAverageRating(0);
      }
    }, (error) => {
      console.error("Error al obtener reseñas recibidas:", error);
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar
  }, [db, user, appId]);

  // Manejador para guardar los cambios del perfil
  const handleSaveProfile = async () => {
    if (!user || !db || !appId) return; // Asegurarse de que haya un user autenticado y Firebase esté listo
    try {
      const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/profiles`, user.uid);
      await setDoc(docRef, {
        name: name,
        email: user.email, // El correo electrónico no debe cambiarse desde la edición del perfil
        location: location,
        photoURL: photoURL, // Usar la URL que ya se actualizó con la subida
        role: role
      }, { merge: true }); // Usar merge para actualizar campos existentes sin sobrescribir otros
      setUserProfile({ name, email: user.email, location, photoURL, role });
      setEditingProfile(false); // Salir del modo de edición
      showSimulatedNotification("Perfil actualizado exitosamente.", "success");
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      showSimulatedNotification(`Error al guardar el perfil: ${error.message}`, "error");
    }
  };

  // Manejador para la selección de archivo de foto de perfil
  const handlePhotoFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Manejador para subir la foto de perfil a Firebase Storage
  const handleUploadPhoto = async () => {
    if (!selectedFile || !user || !storage) {
      showSimulatedNotification("Por favor, selecciona un archivo de imagen primero.", "info");
      return;
    }

    setUploadingPhoto(true);
    showSimulatedNotification("Subiendo foto de perfil...", "info");

    try {
      // Crear una referencia al archivo en Storage
      // Usamos el UID del user para la carpeta y un nombre de archivo genérico (ej. 'profile.jpg')
      const fileRef = ref(storage, `profile_pictures/${user.uid}/profile.jpg`);

      // Subir el archivo
      const snapshot = await uploadBytes(fileRef, selectedFile);

      // Obtener la URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);

      setPhotoURL(downloadURL); // Actualizar el estado con la nueva URL
      showSimulatedNotification("Foto de perfil subida exitosamente.", "success");
      setSelectedFile(null); // Limpiar el archivo seleccionado
    } catch (error) {
      console.error("Error al subir la foto de perfil:", error);
      showSimulatedNotification(`Error al subir la foto: ${error.message}`, "error");
    } finally {
      setUploadingPhoto(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Perfil del Usuario</h2>
        {!editingProfile ? ( // Mostrar vista del perfil si no está editando
          <div className="space-y-4 text-center">
            <img
              src={userProfile.photoURL || 'https://placehold.co/100x100/aabbcc/ffffff?text=User'}
              alt="Foto de perfil"
              className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-blue-500"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/aabbcc/ffffff?text=User'; }}
            />
            <p className="text-lg font-semibold">{userProfile.name}</p>
            <p className="text-gray-600">Email: {userProfile.email}</p>
            <p className="text-gray-600">Ubicación: {userProfile.location || 'No especificada'}</p>
            <p className="text-gray-600">Rol: <span className="font-bold capitalize">{userProfile.role}</span></p>
            <p className="text-gray-600">ID de Usuario: <span className="font-mono text-sm">{user.uid}</span></p>

            <div className="mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Reseñas Recibidas</h3>
              {receivedReviews.length > 0 ? (
                <>
                  <p className="text-lg font-semibold text-gray-700 mb-2">Calificación Promedio: {averageRating} / 5</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {receivedReviews.map(review => (
                      <div key={review.id} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-purple-400 text-left">
                        <p className="font-bold text-purple-700">Calificación: {review.rating} / 5</p>
                        {review.comment && <p className="text-gray-700 italic">"{review.comment}"</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          Por: {review.reviewerId.substring(0, 8)}... el {new Date(review.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-600 italic">Aún no has recibido reseñas.</p>
              )}
            </div>

            <button
              onClick={() => setEditingProfile(true)}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
            >
              Editar Perfil
            </button>
            <button
              onClick={() => setEditingProfile(false)} // Cerrar el formulario de perfil
              className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
            >
              Cerrar
            </button>
          </div>
        ) : ( // Mostrar formulario de edición si está editando
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editName">
                Nombre
              </label>
              <input
                type="text"
                id="editName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={name}
                onChange={(e) => setName(e.target.value)}
                // Los campos de texto HTML no tienen límites de longitud inherentes
                // a menos que se especifique un atributo 'maxlength'.
                // Este campo está diseñado para aceptar el nombre completo.
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editLocation">
                Ubicación
              </label>
              <input
                type="text"
                id="editLocation"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                // Este campo también está diseñado para aceptar una ubicación completa.
              />
            </div>
            {/* Sección para subir foto de perfil */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="photoUpload">
                Foto de Perfil:
              </label>
              <input
                type="file"
                id="photoUpload"
                accept="image/*"
                onChange={handlePhotoFileChange}
                className="w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="text-xs text-gray-600 mt-1">Archivo seleccionado: {selectedFile.name}</p>
              )}
              <button
                onClick={handleUploadPhoto}
                disabled={!selectedFile || uploadingPhoto}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto ? 'Subiendo...' : 'Subir Foto'}
              </button>
              {photoURL && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-700 mb-2">Previsualización de Foto Actual:</p>
                  <img
                    src={photoURL}
                    alt="Previsualización de perfil"
                    className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-gray-300"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/aabbcc/ffffff?text=User'; }}
                  />
                  <p className="text-xs text-gray-500 mt-1 break-all">URL: {photoURL.substring(0, 50)}...</p>
                </div>
              )}
              <p className="text-xs text-gray-600 mt-2 italic">
                La foto se subirá a Firebase Storage. Asegúrate de configurar las reglas de seguridad de Storage.
                También, si la imagen no carga después de subirla, puede que necesites configurar CORS en tu bucket de Storage.
              </p>
            </div>
            {/* Fin de la sección para subir foto de perfil */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editRole">
                Rol
              </label>
              <select
                id="editRole"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="buyer">Comprador</option>
                <option value="seller">Vendedor</option>
                </select>
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={handleSaveProfile}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para una tarjeta de producto individual
const ProductCard = ({ item, isFavoriteView, onToggleFavorite, onContactSeller, onLeaveReview, onViewSellerReviews }) => {
  const { userId } = useContext(FirebaseContext); // Obtener el ID del user actual del contexto
  const isMyProduct = item.userId === userId; // Verificar si el producto es del user actual

  return (
    <div className="bg-blue-50 p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 shadow-sm border-l-4 border-blue-500 flex flex-col">
      {/* Mostrar imágenes del producto o un placeholder si no hay */}
      {item.imageUrls && item.imageUrls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2 sm:mb-3">
          {item.imageUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`${item.name} - ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/100x100/cccccc/333333?text=No+Image`; }}
            />
          ))}
        </div>
      ) : (
        <img
          src={`https://placehold.co/400x200/cccccc/333333?text=No+Image`}
          alt={item.name}
          className="w-full h-40 sm:h-48 object-cover rounded-lg mb-2 sm:mb-3"
        />
      )}
      {/* Detalles del producto */}
      <h3 className="text-lg sm:text-xl font-bold mb-1 text-gray-800">{item.name}</h3>
      <p className="text-base sm:text-lg text-green-600 font-bold mb-1">Precio: C${item.price}</p>
      <p className="text-sm sm:text-base text-gray-700 mb-1">{item.description}</p>
      <p className="text-sm sm:text-base text-gray-700 mb-1">Categoría: {item.category}</p>
      <p className="text-sm sm:text-base text-gray-700 mb-1">Condición: {item.condition}</p>
      <p className="text-sm sm:text-base text-gray-700 mb-1">Ciudad: {item.city}</p>
      <p className="text-xs text-gray-500 text-right mt-1 sm:mt-2">Publicado por: {item.userId.substring(0, 8)}...</p>

      {/* Botones de acción */}
      <div className="flex justify-between items-center mt-3 sm:mt-4 flex-wrap gap-2">
        {!isMyProduct && ( // No mostrar botón de contacto si es mi propio producto
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg text-xs sm:text-sm shadow-md transition duration-300 ease-in-out"
            onClick={() => onContactSeller(item.userId, item.name)}
          >
            Contactar Vendedor
          </button>
        )}
        <button
          className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold shadow-md transition duration-300 ease-in-out ${isFavoriteView ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
          onClick={() => onToggleFavorite(item)}
        >
          {isFavoriteView ? 'Eliminar de Favoritos' : 'Agregar a Favoritos'}
        </button>
        {!isMyProduct && ( // Solo permitir dejar reseña si no es mi producto
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-lg text-xs sm:text-sm shadow-md transition duration-300 ease-in-out"
            onClick={() => onLeaveReview(item.userId, item.id)}
          >
            Dejar Reseña
          </button>
        )}
        <button
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg text-xs sm:text-sm shadow-md transition duration-300 ease-in-out"
          onClick={() => onViewSellerReviews(item.userId)}
        >
          Ver Reseñas del Vendedor
        </button>
      </div>
    </div>
  );
};


// Pantalla de Productos
const ProductsScreen = ({ onContactSeller, onLeaveReview, showSimulatedNotification, onViewSellerReviews }) => {
  const { db, userId, appId } = useContext(FirebaseContext); // Obtener appId del contexto
  const [products, setProducts] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [smartSearchQuery, setSmartSearchQuery] = useState(''); // Nuevo estado para la búsqueda inteligente
  const [isSmartSearching, setIsSmartSearching] = useState(false); // Nuevo estado para el indicador de carga
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterCondition, setFilterCondition] = useState(''); // 'nuevo', 'usado', ''
  const [favoriteProductIds, setFavoriteProductIds] = useState({}); // Para saber si un producto ya es favorito

  // Cargar productos
  useEffect(() => {
    if (!db || !userId || !appId) return; // Asegurarse de que appId esté disponible

    const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
    const q = query(productsCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsList);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener productos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, appId]); // Añadir appId a las dependencias

  // Cargar favoritos del user para mostrar el estado en los botones
  useEffect(() => {
    if (!db || !userId || !appId) return; // Asegurarse de que appId esté disponible

    const favoritesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/favorites`);
    const unsubscribe = onSnapshot(favoritesCollectionRef, (snapshot) => {
      const favIds = {};
      snapshot.docs.forEach(doc => {
        favIds[doc.id] = true; // Usar el ID del producto como clave
      });
      setFavoriteProductIds(favIds);
    }, (error) => {
      console.error("Error al obtener favoritos:", error);
    });

    return () => unsubscribe();
  }, [db, userId, appId]); // Añadir appId a las dependencias


  const handleAddProduct = async (newProduct) => {
    try {
      if (!appId) { // Verificar appId antes de usarlo
        console.error("Error: appId no está definido para agregar producto.");
        showSimulatedNotification("Error: la aplicación no está completamente inicializada.", "error");
        return;
      }
      const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
      await addDoc(productsCollectionRef, {
        ...newProduct,
        userId: userId,
        createdAt: new Date().toISOString(),
      });
      setShowPostForm(false);
      showSimulatedNotification("¡Producto publicado con éxito!", "success");
      console.log("Producto agregado exitosamente.");
    } catch (error) {
      console.error("Error al agregar producto:", error);
      showSimulatedNotification(`Error al publicar producto: ${error.message}`, "error");
    }
  };

  const handleToggleFavorite = async (product) => {
    if (!db || !userId || !appId) { // Asegurarse de que appId esté disponible
      console.warn("User o appId no disponible para favoritos.");
      showSimulatedNotification("Necesitas iniciar sesión para gestionar favoritos.", "error");
      return;
    }

    const favoriteDocRef = doc(db, `artifacts/${appId}/users/${userId}/favorites`, product.id);

    try {
      if (favoriteProductIds[product.id]) {
        // Ya es favorito, eliminar
        await deleteDoc(favoriteDocRef);
        showSimulatedNotification("Producto eliminado de favoritos.", "info");
        console.log("Producto eliminado de favoritos.");
      } else {
        // No es favorito, agregar
        await setDoc(favoriteDocRef, {
          productId: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          city: product.city,
          condition: product.condition,
          imageUrls: product.imageUrls || [], // Guardar el array de URLs
          addedAt: new Date().toISOString(),
          originalUserId: product.userId, // Guarda el ID del user que lo publicó originalmente
        });
        showSimulatedNotification("Producto agregado a favoritos.", "success");
        console.log("Producto agregado a favoritos.");
      }
    } catch (error) {
      console.error("Error al alternar favorito:", error);
      showSimulatedNotification(`Error al gestionar favoritos: ${error.message}`, "error");
    }
  };

  const handleSmartSearch = async () => {
    if (!smartSearchQuery.trim()) {
      showSimulatedNotification("Por favor, ingresa una consulta para la búsqueda inteligente.", "info");
      return;
    }

    setIsSmartSearching(true);
    showSimulatedNotification("Realizando búsqueda inteligente...", "info");

    const prompt = `Analiza la siguiente consulta de búsqueda de productos para un mercado en Nicaragua. Extrae las palabras clave, la ciudad (si se especifica y está en la lista de ciudades de Nicaragua), la categoría (si se especifica y está en la lista de categorías de productos), el precio mínimo, el precio máximo y la condición (Nuevo o Usado). Si un campo no se especifica, déjalo como una cadena vacuda para strings o null para números.

    Lista de ciudades de Nicaragua: ${nicaraguanCities.join(', ')}
    Lista de categorías de productos: ${productCategories.join(', ')}

    Consulta: "${smartSearchQuery}"

    Formato de salida JSON (asegúrate de que los valores de ciudad y categoría coincidan exactamente con las listas proporcionadas):
    `;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            "keywords": { "type": "STRING" },
            "city": { "type": "STRING" },
            "category": { "type": "STRING" },
            "minPrice": { "type": "NUMBER", "nullable": true },
            "maxPrice": { "type": "NUMBER", "nullable": true },
            "condition": { "type": "STRING" }
          },
          "propertyOrdering": ["keywords", "city", "category", "minPrice", "maxPrice", "condition"]
        }
      }
    };

    const apiKey = ""; // Canvas will automatically provide it in runtime
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        const parsedFilters = JSON.parse(jsonString);

        // Aplicar los filtros extraídos
        setSearchTerm(parsedFilters.keywords || '');
        setFilterCity(nicaraguanCities.includes(parsedFilters.city) ? parsedFilters.city : '');
        setFilterCategory(productCategories.includes(parsedFilters.category) ? parsedFilters.category : '');
        setFilterMinPrice(parsedFilters.minPrice !== null ? String(parsedFilters.minPrice) : '');
        setFilterMaxPrice(parsedFilters.maxPrice !== null ? String(parsedFilters.maxPrice) : '');
        setFilterCondition(['Nuevo', 'Usado'].includes(parsedFilters.condition) ? parsedFilters.condition : '');

        showSimulatedNotification("Filtros aplicados desde búsqueda inteligente.", "success");
      } else {
        showSimulatedNotification("No se pudieron extraer filtros de la consulta. Intenta ser más específico.", "error");
        console.error("Respuesta inesperada de la API de Gemini:", result);
      }
    } catch (error) {
      showSimulatedNotification(`Error en la búsqueda inteligente: ${error.message}`, "error");
      console.error("Error al llamar a la API de Gemini:", error);
    } finally {
      setIsSmartSearching(false);
    }
  };


  const filteredProducts = products.filter(product => {
    const matchesSearchTerm = searchTerm === '' ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = filterCity === '' || product.city === filterCity;
    const matchesCategory = filterCategory === '' || product.category === filterCategory;
    const matchesCondition = filterCondition === '' || product.condition === filterCondition;

    const price = parseFloat(product.price);
    const matchesMinPrice = filterMinPrice === '' || price >= parseFloat(filterMinPrice);
    const matchesMaxPrice = filterMaxPrice === '' || price <= parseFloat(filterMaxPrice);

    return matchesSearchTerm && matchesCity && matchesCategory && matchesCondition && matchesMinPrice && matchesMaxPrice;
  });

  if (loading) {
    return (
      <div className="flex flex-1 justify-center items-center bg-white rounded-2xl p-4 shadow-md">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-base text-gray-700">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white rounded-2xl p-3 sm:p-4 shadow-md"> {/* Ajuste de padding */}
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800 text-center">Productos en Venta</h2> {/* Ajuste de tamaño de fuente y margin */}
      <button
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl self-center mb-4 sm:mb-6 shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
        onClick={() => setShowPostForm(true)}
      >
        Publicar Producto
      </button>

      {showPostForm && (
        // Pasar showSimulatedNotification a PostProductForm
        <PostProductForm
          onSubmit={handleAddProduct}
          onCancel={() => setShowPostForm(false)}
          showSimulatedNotification={showSimulatedNotification}
        />
      )}

      {/* Sección de Búsqueda y Filtros */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-xl shadow-inner"> {/* Ajuste de padding y margin */}
        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-700">Búsqueda y Filtros</h3> {/* Ajuste de tamaño de fuente */}
        
        {/* Búsqueda Inteligente */}
        <div className="mb-4">
          <label htmlFor="smartSearch" className="block text-gray-700 text-sm font-bold mb-2">Búsqueda Inteligente:</label>
          <div className="flex">
            <input
              id="smartSearch"
              className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
              placeholder="Ej: 'moto usada en León bajo 1000$' o 'celular nuevo'"
              value={smartSearchQuery}
              onChange={(e) => setSmartSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSmartSearch();
                }
              }}
              disabled={isSmartSearching}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-lg shadow-md transition duration-300 ease-in-out text-sm sm:text-base"
              onClick={handleSmartSearch}
              disabled={isSmartSearching}
            >
              {isSmartSearching ? 'Buscando...' : 'Buscar Inteligentemente'}
            </button>
          </div>
        </div>

        <input
          className="w-full p-2 border border-gray-300 rounded-lg mb-2 sm:mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
          placeholder="Buscar por nombre o descripción (búsqueda manual)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"> {/* Ajuste de gap */}
          <select
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">Filtrar por Ciudad</option>
            {nicaraguanCities.map((cityName) => (
              <option key={cityName} value={cityName}>{cityName}</option>
            ))}
          </select>
          <select
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Filtrar por Categoría</option>
            {productCategories.map((categoryName) => (
              <option key={categoryName} value={categoryName}>{categoryName}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3"> {/* Ajuste de gap y margin */}
          <input
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
            type="number"
            placeholder="Precio Mínimo"
            value={filterMinPrice}
            onChange={(e) => setFilterMinPrice(e.target.value)}
          />
          <input
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
            type="number"
            placeholder="Precio Máximo"
            value={filterMaxPrice}
            onChange={(e) => setFilterMaxPrice(e.target.value)}
          />
        </div>
        <div className="flex items-center mt-2 sm:mt-3 space-x-2 sm:space-x-4 text-sm sm:text-base"> {/* Ajuste de margin, space y tamaño de fuente */}
          <label className="flex items-center">
            <input
              type="radio"
              name="condition"
              value=""
              checked={filterCondition === ''}
              onChange={() => setFilterCondition('')}
              className="mr-1"
            />
            Todos
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="condition"
              value="Nuevo"
              checked={filterCondition === 'Nuevo'}
              onChange={() => setFilterCondition('Nuevo')}
              className="mr-1"
            />
            Nuevo
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="condition"
              value="Usado"
              checked={filterCondition === 'Usado'}
              onChange={() => setFilterCondition('Usado')}
              className="mr-1"
            />
            Usado
          </label>
        </div>
      </div>


      {filteredProducts.length === 0 ? (
        <p className="text-base sm:text-lg text-gray-600 text-center italic mt-6 sm:mt-8">No hay productos disponibles con estos filtros. ¡Sé el primero en publicar!</p>
      ) : (
        <div className="overflow-y-auto flex-1">
          {filteredProducts.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              isFavoriteView={favoriteProductIds[item.id]} // Pasa si es favorito
              onToggleFavorite={handleToggleFavorite}
              onContactSeller={onContactSeller} // Pasa la función de contacto
              onLeaveReview={onLeaveReview} // Pasa la función para dejar reseña
              onViewSellerReviews={onViewSellerReviews} // Pasa la función para ver reseñas
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Formulario para publicar un producto
const PostProductForm = ({ onSubmit, onCancel, showSimulatedNotification }) => { // Recibir showSimulatedNotification
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [message, setMessage] = useState('');
  const [generatingDescription, setGeneratingDescription] = useState(false); // Nuevo estado de carga para Gemini
  const fileInputRef = useRef(null);
  const MAX_IMAGES = 9;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImageUrls = [...imageUrls];
    let filesProcessed = 0;

    files.forEach(file => {
      if (newImageUrls.length >= MAX_IMAGES) {
        setMessage(`Solo puedes subir un máximo de ${MAX_IMAGES} imágenes.`);
        return;
      }

      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImageUrls.push(reader.result);
          setImageUrls([...newImageUrls]);
          filesProcessed++;
          if (filesProcessed === files.length) {
            setMessage('');
          }
        };
        reader.readAsDataURL(file);
      } else {
        setMessage('Por favor, selecciona solo archivos de imagen válidos.');
      }
    });

    e.target.value = null;
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageUrls(prevUrls => prevUrls.filter((_, index) => index !== indexToRemove));
    setMessage('');
  };

  const handleSubmit = () => {
    if (name && price && description && city && category && condition) {
      onSubmit({ name, price, description, city, category, condition, imageUrls });
      setMessage('');
    } else {
      setMessage('Por favor, completa todos los campos obligatorios.');
    }
  };

  // Función para generar la descripción con Gemini
  const handleGenerateDescription = async () => {
    if (!name || !category || !condition) {
      showSimulatedNotification("Por favor, ingresa el nombre, categoría y condición del producto para generar la descripción.", "info");
      return;
    }

    setGeneratingDescription(true);
    showSimulatedNotification("Generando descripción con IA...", "info");

    const prompt = `Genera una descripción de producto atractiva y detallada para un mercado en línea en Nicaragua. Incluye detalles relevantes, beneficios para el comprador y un tono amigable. El producto es un "${name}" de la categoría "${category}" y está en condición "${condition}". La descripción debe tener entre 50 y 150 palabras, enfocándose en atraer a compradores nicaragüenses.`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    const apiKey = ""; // Canvas will automatically provide it in runtime
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const generatedText = result.candidates[0].content.parts[0].text;
        setDescription(generatedText); // Establecer la descripción generada
        showSimulatedNotification("Descripción generada con éxito.", "success");
      } else {
        showSimulatedNotification("No se pudo generar la descripción. Intenta de nuevo.", "error");
        console.error("Respuesta inesperada de la API de Gemini:", result);
      }
    } catch (error) {
      showSimulatedNotification(`Error al generar descripción: ${error.message}`, "error");
      console.error("Error al llamar a la API de Gemini:", error);
    } finally {
      setGeneratingDescription(false);
    }
  };


  return (
    <div className="bg-blue-100 p-4 sm:p-6 rounded-2xl mb-4 sm:mb-6 shadow-lg overflow-y-auto max-h-96">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 text-blue-700 text-center">Publicar Nuevo Producto</h2>
      <input
        className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg mb-2 sm:mb-3 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="Nombre del Producto"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg mb-2 sm:mb-3 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="Precio (C$)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        type="number"
      />
      <textarea
        className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg mb-2 sm:mb-3 bg-white text-sm sm:text-base h-20 sm:h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="Descripción del Producto"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      ></textarea>
      {/* Botón para generar descripción con IA */}
      <button
        onClick={handleGenerateDescription}
        disabled={!name || !category || !condition || generatingDescription}
        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
      >
        {generatingDescription ? 'Generando...' : 'Generar Descripción ✨'}
      </button>
      <select
        className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg mb-2 sm:mb-3 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      >
        <option value="">Selecciona una ciudad</option>
        {nicaraguanCities.map((cityName) => (
          <option key={cityName} value={cityName}>{cityName}</option>
        ))}
      </select>
      <select
        className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg mb-2 sm:mb-3 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">Selecciona una categoría</option>
        {productCategories.map((categoryName) => (
          <option key={categoryName} value={categoryName}>{categoryName}</option>
        ))}
      </select>
      <select
        className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg mb-2 sm:mb-3 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={condition}
        onChange={(e) => setCondition(e.target.value)}
      >
        <option value="">Selecciona la condición</option>
        <option value="Nuevo">Nuevo</option>
        <option value="Usado">Usado</option>
      </select>
      
      <div className="mb-3 sm:mb-4">
        <label htmlFor="imageUpload" className="block text-gray-700 text-sm font-bold mb-2">Imágenes del Producto (máx. {MAX_IMAGES}):</label>
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          ref={fileInputRef}
          className="w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {imageUrls.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative">
                <img src={url} alt={`Previsualización ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-600 mt-2 italic">
          Selecciona hasta {MAX_IMAGES} imágenes desde tu galería. En una aplicación real, estas imágenes se subirían a Firebase Storage.
        </p>
      </div>

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl w-full mt-3 sm:mt-4 shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        onClick={handleSubmit}
      >
        Publicar
      </button>
      <button
        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl w-full mt-2 sm:mt-3 shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        onClick={onCancel}
      >
        Cancelar
      </button>
      {message && <p className="mt-3 sm:mt-4 text-red-600 text-xs sm:text-sm text-center">{message}</p>}
    </div>
  );
};

// Pantalla de Trabajos
const JobsScreen = () => {
  const { db, userId, appId } = useContext(FirebaseContext); // Obtener appId del contexto
  const [jobs, setJobs] = useState([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');

  useEffect(() => {
    if (!db || !userId || !appId) return; // Asegurarse de que appId esté disponible

    const jobsCollectionRef = collection(db, `artifacts/${appId}/public/data/jobs`);
    const q = query(jobsCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobs(jobsList);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener trabajos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, appId]); // Añadir appId a las dependencias

  const handleAddJob = async (newJob) => {
    try {
      if (!appId) { // Verificar appId antes de usarlo
        console.error("Error: appId no está definido para agregar trabajo.");
        return;
      }
      const jobsCollectionRef = collection(db, `artifacts/${appId}/public/data/jobs`);
      await addDoc(jobsCollectionRef, {
        ...newJob,
        userId: userId, // Asociar el trabajo con el ID del user
        createdAt: new Date().toISOString(),
      });
      setShowPostForm(false);
      console.log("Trabajo agregado exitosamente.");
    } catch (error) {
      console.error("Error al agregar trabajo:", error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearchTerm = searchTerm === '' ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = filterCity === '' || job.city === filterCity;

    return matchesSearchTerm && matchesCity;
  });

  if (loading) {
    return (
      <div className="flex flex-1 justify-center items-center bg-white rounded-2xl p-4 shadow-md">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-base text-gray-700">Cargando trabajos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white rounded-2xl p-3 sm:p-4 shadow-md"> {/* Ajuste de padding */}
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800 text-center">Ofertas de Trabajo</h2> {/* Ajuste de tamaño de fuente y margin */}
      <button
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl self-center mb-4 sm:mb-6 shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
        onClick={() => setShowPostForm(true)}
      >
        Publicar Trabajo
      </button>

      {showPostForm && (
        <PostJobForm onSubmit={handleAddJob} onCancel={() => setShowPostForm(false)} />
      )}

      {/* Sección de Búsqueda y Filtros para Trabajos */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-xl shadow-inner"> {/* Ajuste de padding y margin */}
        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-700">Búsqueda y Filtros</h3> {/* Ajuste de tamaño de fuente */}
        <input
          className="w-full p-2 border border-gray-300 rounded-lg mb-2 sm:mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
          placeholder="Buscar por título o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="w-full p-2 border border-gray-300 rounded-lg mb-2 sm:mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
        >
          <option value="">Selecciona una ciudad</option>
          {nicaraguanCities.map((cityName) => (
            <option key={cityName} value={cityName}>{cityName}</option>
          ))}
        </select>
      </div>

      {filteredJobs.length === 0 ? (
        <p className="text-base sm:text-lg text-gray-600 text-center italic mt-6 sm:mt-8">No hay ofertas de trabajo disponibles con estos filtros. ¡Sé el primero en publicar!</p>
      ) : (
        <div className="overflow-y-auto flex-1">
          {filteredJobs.map((item) => (
            <div key={item.id} className="bg-blue-50 p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 shadow-sm border-l-4 border-blue-500"> {/* Ajuste de padding y margin */}
              <h3 className="text-lg sm:text-xl font-bold mb-1 text-gray-800">{item.title}</h3> {/* Ajuste de tamaño de fuente */}
              <p className="text-sm sm:text-base text-gray-700 mb-1">{item.description}</p> {/* Ajuste de tamaño de fuente */}
              {/* Información de contacto eliminada */}
              <p className="text-sm sm:text-base text-gray-700 mb-1">Ciudad: {item.city}</p>
              <p className="text-xs text-gray-500 text-right mt-1 sm:mt-2">Publicado por: {item.userId.substring(0, 8)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Formulario para publicar un trabajo
const PostJobForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (title && description && city) {
      onSubmit({ title, description, city });
      setMessage('');
    } else {
      setMessage('Por favor, completa todos los campos.');
    }
  };

  return (
    <div className="bg-blue-100 p-4 sm:p-6 rounded-2xl mb-4 sm:mb-6 shadow-lg overflow-y-auto max-h-96">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 text-blue-700 text-center">Publicar Nueva Oferta de Trabajo</h2>
      <input
        className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg mb-2 sm:mb-3 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="Título del Puesto"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg mb-2 sm:mb-3 bg-white text-sm sm:text-base h-20 sm:h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="Descripción del Trabajo"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      ></textarea>
      <select
        className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg mb-2 sm:mb-3 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      >
        <option value="">Selecciona una ciudad</option>
        {nicaraguanCities.map((cityName) => (
          <option key={cityName} value={cityName}>{cityName}</option>
        ))}
      </select>
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl w-full mt-3 sm:mt-4 shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        onClick={handleSubmit}
      >
        Publicar
      </button>
      <button
        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl w-full mt-2 sm:mt-3 shadow-md transition duration-300 ease-in-out transform hover:scale-105"
        onClick={onCancel}
      >
        Cancelar
      </button>
      {message && <p className="mt-3 sm:mt-4 text-red-600 text-xs sm:text-sm text-center">{message}</p>}
    </div>
  );
};

// Nueva pantalla de Favoritos
const FavoritesScreen = ({ onContactSeller, onLeaveReview, showSimulatedNotification, onViewSellerReviews }) => {
  const { db, userId, appId } = useContext(FirebaseContext); // Obtener appId del contexto
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar productos favoritos del user
  useEffect(() => {
    if (!db || !userId || !appId) return; // Asegurarse de que appId esté disponible

    // Ruta de la colección privada de favoritos del user
    const favoritesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/favorites`);
    const q = query(favoritesCollectionRef);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const favsList = [];
      for (const docSnapshot of snapshot.docs) {
        const favData = docSnapshot.data();
        // Por simplicidad, solo usamos los datos guardados en la colección de favoritos
        favsList.push({ id: docSnapshot.id, ...favData, favoriteDocId: docSnapshot.id });
      }
      setFavoriteProducts(favsList);
      setLoading(false);
    }, (error) => {
      console.error("Error al obtener favoritos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, appId]); // Añadir appId a las dependencias

  const handleRemoveFavorite = async (favoriteDocId) => {
    if (!db || !userId || !appId) return; // Asegurarse de que appId esté disponible
    try {
      const favoriteDocRef = doc(db, `artifacts/${appId}/users/${userId}/favorites`, favoriteDocId);
      await deleteDoc(favoriteDocRef);
      showSimulatedNotification("Producto eliminado de favoritos.", "info");
      console.log("Producto eliminado de favoritos.");
    } catch (error) {
      console.error("Error al eliminar de favoritos:", error);
      showSimulatedNotification(`Error al eliminar de favoritos: ${error.message}`, "error");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 justify-center items-center bg-white rounded-2xl p-4 shadow-md">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-base text-gray-700">Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white rounded-2xl p-3 sm:p-4 shadow-md"> {/* Ajuste de padding */}
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800 text-center">Mis Productos Favoritos</h2> {/* Ajuste de tamaño de fuente y margin */}
      {favoriteProducts.length === 0 ? (
        <p className="text-base sm:text-lg text-gray-600 text-center italic mt-6 sm:mt-8">No tienes productos guardados en favoritos.</p>
      ) : (
        <div className="overflow-y-auto flex-1">
          {favoriteProducts.map((item) => (
            <ProductCard
              key={item.id} // Usar el ID del producto original
              item={item}
              isFavoriteView={true} // Indica que estamos en la vista de favoritos
              onToggleFavorite={() => handleRemoveFavorite(item.favoriteDocId)} // Pasa el ID del documento de favorito
              onContactSeller={onContactSeller} // Pasa la función de contacto
              onLeaveReview={onLeaveReview} // Pasa la función para dejar reseña
              onViewSellerReviews={onViewSellerReviews} // Pasa la función para ver reseñas
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de Chat
const ChatScreen = ({ recipientId, productName, onCloseChat, showSimulatedNotification }) => {
  const { db, userId } = useContext(FirebaseContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Generar un chatId único y consistente para la conversación entre dos users
  const chatId = [userId, recipientId].sort().join('_');

  // Efecto para cargar los mensajes del chat en tiempo real
  useEffect(() => {
    if (!db || !userId || !recipientId) return;

    const messagesCollectionRef = collection(db, `conversations/${chatId}/messages`);
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'), limit(50)); // Ordenar por timestamp y limitar mensajes

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    }, (error) => {
      console.error("Error al obtener mensajes:", error);
    });

    return () => unsubscribe(); // Limpiar el listener
  }, [db, userId, recipientId, chatId]);

  // Efecto para hacer scroll al final de los mensajes cuando se actualizan
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Manejador para enviar un mensaje
  const handleSendMessage = async () => {
    if (!db || !userId || !recipientId || newMessage.trim() === '') return;

    try {
      const messagesCollectionRef = collection(db, `conversations/${chatId}/messages`);
      await addDoc(messagesCollectionRef, {
        senderId: userId,
        recipientId: recipientId,
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
      });
      setNewMessage(''); // Limpiar el campo de entrada
      showSimulatedNotification(`Mensaje enviado a ${recipientId.substring(0, 8)}...`, "info");
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      showSimulatedNotification(`Error al enviar mensaje: ${error.message}`, "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-5/6 flex flex-col">
        <div className="bg-blue-600 p-3 sm:p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold text-white">Chat con {recipientId.substring(0, 8)}... sobre {productName}</h2>
          <button
            className="text-white text-xl sm:text-2xl font-bold hover:text-gray-200"
            onClick={onCloseChat}
          >
            &times;
          </button>
        </div>
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col-reverse">
          <div ref={messagesEndRef} />
          {messages.slice().reverse().map((msg) => ( // Invertir para mostrar los más nuevos abajo
            <div
              key={msg.id}
              className={`mb-1 sm:mb-2 p-2 sm:p-3 rounded-lg max-w-[80%] text-sm sm:text-base ${
                msg.senderId === userId
                  ? 'bg-blue-100 self-end text-right'
                  : 'bg-gray-100 self-start text-left'
              }`}
            >
              <p className="text-sm sm:text-base text-gray-800">{msg.text}</p>
              <p className="text-xs text-gray-500 mt-1">
                {msg.senderId === userId ? 'Tú' : msg.senderId.substring(0, 8)}... - {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
        <div className="p-3 sm:p-4 border-t border-gray-200 flex">
          <input
            type="text"
            className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-5 rounded-r-lg shadow-md transition duration-300 ease-in-out text-sm sm:text-base"
            onClick={handleSendMessage}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para el formulario de reseña
const ReviewForm = ({ sellerId, productId, onClose, showSimulatedNotification }) => {
  const { db, userId, appId } = useContext(FirebaseContext);
  const [rating, setRating] = useState(5); // Valor por defecto de 5 estrellas
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejador para enviar la reseña
  const handleSubmitReview = async () => {
    if (!db || !userId || !sellerId || !rating || !appId) {
      setMessage('Por favor, selecciona una calificación y asegúrate de que la aplicación esté inicializada.');
      return;
    }
    if (userId === sellerId) { // Evitar que un user se reseñe a sí mismo
      setMessage('No puedes dejar una reseña a ti mismo.');
      return;
    }

    setIsSubmitting(true); // Activar indicador de envío
    setMessage(''); // Limpiar mensajes anteriores

    try {
      const reviewsCollectionRef = collection(db, `artifacts/${appId}/users/${sellerId}/reviews`);
      await addDoc(reviewsCollectionRef, {
        reviewerId: userId, // ID del user que deja la reseña
        rating: parseInt(rating), // Calificación numérica
        comment: comment.trim(), // Comentario (limpiado de espacios)
        productId: productId || null, // ID del producto relacionado (puede ser nulo)
        timestamp: new Date().toISOString(), // Marca de tiempo
      });
      setMessage('¡Reseña enviada con éxito!');
      showSimulatedNotification(`Reseña enviada a ${sellerId.substring(0, 8)}...`, "success");
      setRating(5); // Resetear formulario
      setComment('');
      setTimeout(onClose, 1500); // Cerrar el formulario después de un breve mensaje de éxito
    } catch (error) {
      console.error("Error al enviar reseña:", error);
      setMessage(`Error al enviar reseña: ${error.message}`);
      showSimulatedNotification(`Error al enviar reseña: ${error.message}`, "error");
    } finally {
      setIsSubmitting(false); // Desactivar indicador de envío
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700">Dejar Reseña para {sellerId.substring(0, 8)}...</h2>
          <button
            className="text-gray-600 text-xl sm:text-2xl font-bold hover:text-gray-800"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="mb-3 sm:mb-4">
          <label htmlFor="rating" className="block text-gray-700 text-sm font-bold mb-1 sm:mb-2">Calificación:</label>
          <select
            id="rating"
            className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          >
            <option value="5">5 Estrellas - Excelente</option>
            <option value="4">4 Estrellas - Muy Bueno</option>
            <option value="3">3 Estrellas - Bueno</option>
            <option value="2">2 Estrellas - Regular</option>
            <option value="1">1 Estrella - Malo</option>
          </select>
        </div>

        <div className="mb-3 sm:mb-4">
          <label htmlFor="comment" className="block text-gray-700 text-sm font-bold mb-1 sm:mb-2">Comentario (opcional):</label>
          <textarea
            id="comment"
            className="w-full p-2 sm:p-3 border border-blue-200 rounded-lg bg-white text-sm sm:text-base h-20 sm:h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Escribe tu comentario aquí..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          ></textarea>
        </div>

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl w-full shadow-md transition duration-300 ease-in-out transform hover:scale-105 text-sm sm:text-base"
          onClick={handleSubmitReview}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
        </button>
        {message && <p className={`mt-3 sm:mt-4 text-xs sm:text-sm text-center ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
      </div>
    </div>
  );
};

// Nuevo componente para mostrar reseñas de un user
const ReviewsDisplay = ({ targetUserId, onClose, showSimulatedNotification }) => {
  const { db, appId } = useContext(FirebaseContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [targetUserName, setTargetUserName] = useState('este user'); // Para mostrar el nombre en lugar del ID

  // Efecto para cargar las reseñas y el perfil del user objetivo
  useEffect(() => {
    const fetchReviewsAndProfile = async () => {
      if (!db || !appId || !targetUserId) return;

      setLoading(true);
      // Obtener el perfil del user objetivo para mostrar su nombre
      try {
        const profileDocRef = doc(db, `artifacts/${appId}/users/${targetUserId}/profiles`, targetUserId);
        const profileSnap = await getDoc(profileDocRef);
        if (profileSnap.exists()) {
          setTargetUserName(profileSnap.data().name || targetUserId.substring(0, 8) + '...');
        } else {
          setTargetUserName(targetUserId.substring(0, 8) + '...');
        }
      } catch (error) {
        console.error("Error al obtener el perfil del user objetivo:", error);
        setTargetUserName(targetUserId.substring(0, 8) + '...'); // Fallback al ID
      }


      // Obtener las reseñas para el user objetivo
      const reviewsCollectionRef = collection(db, `artifacts/${appId}/users/${targetUserId}/reviews`);
      const q = query(reviewsCollectionRef, orderBy('timestamp', 'desc')); // Ordenar por fecha descendente

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reviewsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviews(reviewsList);

        if (reviewsList.length > 0) {
          const totalRating = reviewsList.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating((totalRating / reviewsList.length).toFixed(1)); // Calcular promedio
        } else {
          setAverageRating(0);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error al obtener reseñas:", error);
        showSimulatedNotification("Error al cargar las reseñas.", "error");
        setLoading(false);
      });

      return () => unsubscribe(); // Limpiar el listener
    };

    fetchReviewsAndProfile();
  }, [db, appId, targetUserId, showSimulatedNotification]);

  // Mostrar un spinner de carga mientras se obtienen las reseñas
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col p-4 sm:p-6 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-base text-gray-700">Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700">Reseñas de {targetUserName}</h2>
          <button
            className="text-gray-600 text-xl sm:text-2xl font-bold hover:text-gray-800"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {reviews.length > 0 ? (
          <>
            <p className="text-lg font-semibold text-gray-700 mb-4 text-center">Calificación Promedio: {averageRating} / 5</p>
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
                  <p className="font-bold text-purple-800 text-lg">Calificación: {review.rating} / 5</p>
                  {review.comment && <p className="text-gray-700 italic mt-1">"{review.comment}"</p>}
                  <p className="text-xs text-gray-500 mt-2">
                    Por: {review.reviewerId.substring(0, 8)}... el {new Date(review.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-600 italic text-center text-base mt-4">Este user aún no ha recibido reseñas.</p>
        )}

        <button
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl w-full mt-6 shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

// Componente para la Política de Privacidad
const PrivacyPolicyScreen = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-5/6 flex flex-col p-4 sm:p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-700">Política de Privacidad</h2>
          <button
            className="text-gray-600 text-xl sm:text-2xl font-bold hover:text-gray-800"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <p className="mb-4 text-sm sm:text-base text-gray-700">
            En Cambiazo, nos comprometemos a proteger su privacidad. Esta política de privacidad explica cómo recopilamos, usamos y protegemos su información personal.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">1. Información que Recopilamos</h3>
          <p className="mb-2 text-sm sm:text-base text-gray-700">
            Recopilamos información que usted nos proporciona directamente, como:
          </p>
          <ul className="list-disc list-inside mb-4 text-sm sm:text-base text-gray-700 ml-4">
            <li>**Información de Perfil:** Nombre de user, información de contacto (si la proporciona).</li>
            <li>**Información de Publicación:** Detalles de productos o trabajos que publica (nombre, descripción, precio, categoría, ciudad, condición, imágenes).</li>
            <li>**Mensajes:** Contenido de los mensajes enviados a través de nuestro sistema de chat.</li>
            <li>**Reseñas:** Calificaciones y comentarios que deja sobre otros users o productos.</li>
          </ul>
          <p className="mb-4 text-sm sm:text-base text-gray-700">
            También recopilamos automáticamente cierta información cuando utiliza la aplicación, como su ID de user anónimo (para fines de autenticación y datos de user privados) y datos de uso de la aplicación.
          </p>

          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">2. Uso de la Información</h3>
          <p className="mb-4 text-sm sm:text-base text-gray-700">
            Utilizamos la información recopilada para:
          </p>
          <ul className="list-disc list-inside mb-4 text-sm sm:text-base text-gray-700 ml-4">
            <li>Facilitar la publicación y búsqueda de productos y trabajos.</li>
            <li>Permitir la comunicación entre users (chat).</li>
            <li>Gestionar sus productos favoritos.</li>
            <li>Mejorar la experiencia del user y la funcionalidad de la aplicación.</li>
            <li>Realizar análisis internos y de rendimiento.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">3. Compartir Información</h3>
          <p className="mb-4 text-sm sm:text-base text-gray-700">
            No compartimos su información personal con terceros, excepto en las siguientes circunstancias:
          </p>
          <ul className="list-disc list-inside mb-4 text-sm sm:text-base text-gray-700 ml-4">
            <li>Con su consentimiento explícito.</li>
            <li>Para cumplir con obligaciones legales.</li>
            <li>Para proteger los derechos, la propiedad o la seguridad de Cambiazo, nuestros users o el público.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">4. Seguridad de la Información</h3>
          <p className="mb-4 text-sm sm:text-base text-gray-700">
            Implementamos medidas de seguridad razonables para proteger su información personal contra el acceso no autorizado, la alteración, la divulgación o la destrucción. Sin embargo, ninguna transmisión de datos por Internet o sistema de almacenamiento electrónico es 100% segura.
          </p>
          <div className="flex justify-center my-4">
            <img
              src="https://placehold.co/400x200/ADD8E6/000000?text=Seguridad+de+Datos"
              alt="Representación de seguridad de datos"
              className="rounded-lg shadow-md w-full max-w-xs"
            />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">5. Sus Derechos</h3>
          <p className="mb-4 text-sm sm:text-base text-gray-700">
            Usted tiene derecho a acceder, corregir o eliminar su información personal. Puede gestionar la mayoría de sus datos a través de la sección "Configuración de Perfil" de la aplicación. Para solicitudes adicionales, contáctenos.
          </p>
          <div className="flex justify-center my-4">
            <img
              src="https://placehold.co/400x200/90EE90/000000?text=Control+de+User"
              alt="Representación de control de user"
              className="rounded-lg shadow-md w-full max-w-xs"
            />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">6. Cambios a esta Política</h3>
          <p className="mb-4 text-sm sm:text-base text-gray-700">
            Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos sobre cualquier cambio publicando la nueva política en esta página. Se le recomienda revisar esta política periódicamente para cualquier cambio.
          </p>

          <p className="text-sm sm:text-base text-gray-600 text-right mt-6">
            Última actualización: 6 de Julio de 2025
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105 text-sm sm:text-base"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal de la aplicación
function App() {
  // Estados para la inicialización de Firebase
  const [appInitialized, setAppInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [storage, setStorage] = useState(null); // Nuevo estado para Firebase Storage
  const [userId, setUserId] = useState(null);
  const [appId, setAppId] = useState(null);

  // Estados para la navegación y visibilidad de modales
  const [activeTab, setActiveTab] = useState('productos');
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Estados para la visualización de reseñas de otros usuarios
  const [showReviewsDisplay, setShowReviewsDisplay] = useState(false);
  const [reviewsTargetUserId, setReviewsTargetUserId] = useState(null);

  // Estados para los campos del perfil del usuario (usados en edición del perfil)
  // Estos estados se inicializan desde userProfile en el useEffect y se actualizan al editar el perfil.
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [role, setRole] = useState('buyer'); // Rol por defecto

  const [selectedFile, setSelectedFile] = useState(null); // Nuevo estado para el archivo de foto de perfil
  const [uploadingPhoto, setUploadingPhoto] = useState(false); // Estado para el indicador de carga de foto

  // Efecto para inicializar Firebase y manejar el estado de autenticación
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Tu configuración de Firebase real
        // ¡¡¡IMPORTANTE!!! Reemplaza estos valores con los de tu propio proyecto de Firebase.
        const yourFirebaseConfig = {
          apiKey: "AIzaSyD93M8YLAlaJ4k03CZbh9PBQMbFyUOGPPM",
          authDomain: "cabiazo2.firebaseapp.com",
          projectId: "cabiazo2",
          storageBucket: "cabiazo2.firebasestorage.app",
          messagingSenderId: "98130017996",
          appId: "1:98130017996:web:39f09f1dbcc8abe80c0c69"
        };

        // Determinar la configuración de Firebase a usar:
        // Si __firebase_config está definido (entorno Canvas), úsalo.
        // De lo contrario, usa tu configuración local hardcodeada.
        const firebaseConfigToUse = typeof __firebase_config !== 'undefined'
          ? JSON.parse(__firebase_config)
          : yourFirebaseConfig;

        // Validar que la configuración de Firebase sea completa y no contenga marcadores de posición
        const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
        const isConfigComplete = requiredConfigKeys.every(key =>
          firebaseConfigToUse[key] &&
          !firebaseConfigToUse[key].includes("TU_") // Evitar marcadores de posición
        );

        if (!isConfigComplete) {
          console.error("Error: La configuración de Firebase está incompleta o contiene marcadores de posición. Por favor, asegúrate de reemplazar todos los valores con tus credenciales reales de Firebase.");
          // No inicializar Firebase si la configuración es incorrecta
          setAppInitialized(true); // Marcar como inicializada para evitar el spinner infinito
          return;
        }

        // Determinar el appId a usar:
        // Si __app_id está definido (entorno Canvas), úsalo.
        // De lo contrario, usa un ID predeterminado para desarrollo local.
        const currentAppId = typeof __app_id !== 'undefined' ? __app_id : 'local-dev-app-id';
        setAppId(currentAppId);

        // Determinar el token de autenticación inicial:
        // Si __initial_auth_token está definido (entorno Canvas), úsalo.
        // De lo contrario, no uses ningún token (para signInAnonymously).
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        // Inicializar la aplicación Firebase
        const app = initializeApp(firebaseConfigToUse);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        const storageInstance = getStorage(app); // Inicializar Firebase Storage

        setAuth(authInstance);
        setDb(dbInstance);
        setStorage(storageInstance); // Establecer la instancia de Storage

        // Intentar iniciar sesión con el token personalizado si está disponible, de lo contrario, de forma anónima
        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }

        // Suscribirse a los cambios de estado de autenticación
        const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            setUserId(currentUser.uid);
            console.log("Usuario autenticado:", currentUser.uid);
          } else {
            setUser(null);
            // Generar un ID aleatorio si no hay usuario autenticado (para mantener la funcionalidad de Firestore)
            const newRandomUserId = crypto.randomUUID();
            setUserId(newRandomUserId);
            console.log("Usuario no autenticado. Usando ID aleatorio:", newRandomUserId);
          }
          setAppInitialized(true); // Marcar la aplicación como inicializada después de la autenticación
        });

        // Limpiar la suscripción al desmontar el componente
        return () => unsubscribe();
      } catch (error) {
        console.error("Error al inicializar Firebase:", error);
        showMessage("Error al inicializar la aplicación. Revisa la consola para más detalles.", "error");
        setAppInitialized(true); // Marcar como inicializada incluso si hay error para detener el spinner
      }
    };

    initializeFirebase();
  }, []); // Dependencias vacías para que se ejecute solo una vez al montar

  // Efecto para cargar el perfil del usuario cuando cambia el usuario autenticado o Firebase está listo
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && userId && db && appId) { // Solo si hay un usuario autenticado y su ID, y Firebase está listo
        try {
          // Ruta del documento del perfil del usuario actual en Firestore
          const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/profiles`, user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // Si el perfil existe, cargar sus datos
            const profileData = docSnap.data();
            setUserProfile(profileData);
            setName(profileData.name || '');
            setLocation(profileData.location || '');
            setPhotoURL(profileData.photoURL || '');
            setRole(profileData.role || 'buyer');
          } else {
            // Si no existe, establecer valores predeterminados y crear el perfil
            const defaultProfile = {
              name: user.displayName || '',
              email: user.email || '',
              location: '',
              photoURL: user.photoURL || 'https://placehold.co/100x100/aabbcc/ffffff?text=User',
              role: 'buyer'
            };
            await setDoc(docRef, defaultProfile); // Crear el documento del perfil
            setUserProfile(defaultProfile);
            setName(defaultProfile.name);
            setLocation(defaultProfile.location);
            setPhotoURL(defaultProfile.photoURL);
            setRole(defaultProfile.role);
          }
        } catch (error) {
          console.error("Error al cargar el perfil del usuario:", error);
          showMessage("Error al cargar el perfil del usuario.", "error");
        }
      } else {
        // Limpiar el perfil si no hay user autenticado o Firebase no está listo
        setUserProfile(null);
        // NO resetear name, location, photoURL, role aquí, ya que pueden estar siendo usados por AuthForm
        // Estos se resetearán cuando el usuario cierre sesión explícitamente o la app se reinicie.
      }
    };

    if (appInitialized) { // Solo intentar cargar el perfil si Firebase ya se inicializó
      fetchUserProfile();
    }
  }, [user, userId, db, appId, appInitialized]); // Dependencias del efecto

  // Función para mostrar mensajes temporales
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000); // El mensaje desaparece después de 5 segundos
  };

  // Manejador para el registro o inicio de sesión con email y contraseña
  const handleAuthAction = async (email, password, regName, regLocation) => { // Aceptar regName y regLocation
    try {
      // Nota: createUserWithEmailAndPassword y signInWithEmailAndPassword no están importados, se necesitarían para un registro/inicio de sesión real.
      // Para esta demo, solo simulamos el registro/inicio de sesión.
      // Puedes descomentar y usar las funciones de Firebase Authentication si las importas.
      // import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
      if (isRegistering) {
        // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // const newUser = userCredential.user;
        // await setDoc(doc(db, `artifacts/${appId}/users/${newUser.uid}/profiles`, newUser.uid), {
        //   name: regName, // Usar el nombre del formulario de registro
        //   email: email,
        //   location: regLocation, // Usar la ubicación del formulario de registro
        //   photoURL: 'https://placehold.co/100x100/aabbcc/ffffff?text=User',
        //   role: 'buyer' // O el rol seleccionado
        // });
        showMessage("Registro simulado exitoso. Por favor, inicia sesión.", "success");
      } else {
        // await signInWithEmailAndPassword(auth, email, password);
        showMessage("Inicio de sesión simulado exitoso.", "success");
      }
      setShowAuthForm(false); // Cerrar el formulario de autenticación
    } catch (error) {
      console.error("Error de autenticación:", error);
      showMessage(`Error de autenticación: ${error.message}`, "error");
    }
  };

  // Manejador para el inicio de sesión con Google
  const handleGoogleSignIn = async () => {
    try {
      // Nota: GoogleAuthProvider y signInWithPopup están importados, pero la lógica de Firebase no está completa aquí.
      // const provider = new GoogleAuthProvider();
      // const result = await signInWithPopup(auth, provider);
      // const newUser = result.user;
      // Verificar si el perfil existe, si no, crearlo para los inicios de sesión de Google
      // const docRef = doc(db, `artifacts/${appId}/users/${newUser.uid}/profiles`, newUser.uid);
      // const docSnap = await getDoc(docRef);
      // if (!docSnap.exists()) {
      //   await setDoc(doc(db, `artifacts/${appId}/users/${newUser.uid}/profiles`, newUser.uid), { ... });
      // }
      showMessage("Inicio de sesión con Google simulado exitoso.", "success");
      setShowAuthForm(false); // Cerrar el formulario de autenticación
    } catch (error) {
      console.error("Error con Google Sign-In:", error);
      showMessage(`Error con Google Sign-In: ${error.message}`, "error");
    }
  };

  // Manejador para cerrar sesión
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showMessage("Sesión cerrada correctamente.", "success");
      setShowProfile(false); // Cerrar la vista de perfil al cerrar sesión
      // Resetear los estados del perfil al cerrar sesión
      setName('');
      setLocation('');
      setPhotoURL('');
      setRole('buyer');
      setUserProfile(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      showMessage(`Error al cerrar sesión: ${error.message}`, "error");
    }
  };

  // Manejador para ver las reseñas de un usuario específico
  const handleViewReviews = (targetUserId) => {
    setReviewsTargetUserId(targetUserId);
    setShowReviewsDisplay(true);
  };

  // Estados para el chat y el formulario de reseñas
  const [showChat, setShowChat] = useState(false);
  const [chatRecipientId, setChatRecipientId] = useState(null);
  const [chatProductName, setChatProductName] = useState('');

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewTargetSellerId, setReviewTargetSellerId] = useState(null);
  const [reviewTargetProductId, setReviewTargetProductId] = useState(null);

  // Manejador para contactar a un vendedor (abre el chat)
  const handleContactSeller = (sellerId, productName) => {
    setChatRecipientId(sellerId);
    setChatProductName(productName);
    setShowChat(true);
  };

  // Manejador para dejar una reseña (abre el formulario de reseña)
  const handleLeaveReview = (sellerId, productId) => {
    setReviewTargetSellerId(sellerId);
    setReviewTargetProductId(productId);
    setShowReviewForm(true);
  };

  // Si la aplicación aún no está inicializada, muestra un spinner de carga
  if (!appInitialized) {
    return (
      <div className="flex flex-1 justify-center items-center bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-lg text-gray-700">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  // El componente principal App renderiza todo el contenido
  return (
    // FirebaseContext.Provider hace que db, auth, user, userId, appId estén disponibles
    // para todos los componentes anidados sin pasarlos como props explícitamente.
    <FirebaseContext.Provider value={{ db, auth, user, userId, appId, storage }}> {/* Añadido storage al contexto */}
      <div className="min-h-screen bg-gray-100 font-inter flex flex-col"> {/* Añadido flex-col para footer */}
        {/* Componente para mostrar mensajes/notificaciones */}
        <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

        {/* Encabezado de la aplicación */}
        <header className="bg-blue-700 text-white p-4 shadow-md">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-4xl font-extrabold mb-4 md:mb-0">Cambiazo</h1>
            <nav className="flex flex-wrap justify-center md:justify-end space-x-2 md:space-x-4">
              {user ? ( // Mostrar botones de user autenticado
                <>
                  <button
                    onClick={() => setShowProfile(true)}
                    className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Configuración de Perfil
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-600 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : ( // Mostrar botón de inicio de sesión si no está autenticado
                <button
                  onClick={() => { setShowAuthForm(true); setIsRegistering(false); }}
                  className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  Iniciar Sesión
                </button>
              )}
            </nav>
          </div>
        </header>

        {/* Pestañas de navegación */}
        <div className="bg-gray-200 p-4 shadow-inner">
          <div className="container mx-auto flex justify-center space-x-4">
            <button
              onClick={() => setActiveTab('productos')}
              className={`py-2 px-6 rounded-lg font-semibold transition duration-200 ${
                activeTab === 'productos' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => setActiveTab('trabajos')}
              className={`py-2 px-6 rounded-lg font-semibold transition duration-200 ${
                activeTab === 'trabajos' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Trabajos
            </button>
            <button
              onClick={() => setActiveTab('favoritos')}
              className={`py-2 px-6 rounded-lg font-semibold transition duration-200 ${
                activeTab === 'favoritos' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Favoritos
            </button>
          </div>
        </div>

        {/* Área de contenido principal según la pestaña activa */}
        <main className="py-8 flex-grow"> {/* Añadido flex-grow para empujar el footer hacia abajo */}
          {activeTab === 'productos' && <ProductsScreen onContactSeller={handleContactSeller} onLeaveReview={handleLeaveReview} showSimulatedNotification={showMessage} onViewSellerReviews={handleViewReviews} />}
          {activeTab === 'trabajos' && <JobsScreen />}
          {activeTab === 'favoritos' && (
            <FavoritesScreen
              onContactSeller={handleContactSeller}
              onLeaveReview={handleLeaveReview}
              showSimulatedNotification={showMessage}
              onViewSellerReviews={handleViewReviews} // Corregido: pasar handleViewReviews
            />
          )}
        </main>

        {/* Footer con enlaces de política de privacidad y eliminación de datos */}
        <footer className="bg-gray-800 text-white p-4 text-center mt-auto"> {/* mt-auto para empujar al final */}
          <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => showMessage("La política de privacidad se mostraría aquí en un modal.", "info")}
              className="text-gray-300 hover:text-white font-semibold text-sm transition duration-200"
            >
              Política de Privacidad
            </button>
            <span className="hidden sm:inline-block text-gray-500">|</span> {/* Separador para desktop */}
            <button
              onClick={() => showMessage("La página de eliminación de datos se mostraría aquí en un modal.", "info")}
              className="text-gray-300 hover:text-white font-semibold text-sm transition duration-200"
            >
              Eliminación de Datos
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">&copy; {new Date().getFullYear()} Cambiazo. Todos los derechos reservados.</p>
        </footer>

        {/* Modales condicionales */}
        {showAuthForm && (
          <AuthForm
            onAuthAction={handleAuthAction}
            isRegistering={isRegistering}
            onClose={() => { setShowAuthForm(false); setIsRegistering(!isRegistering); }} // Alternar modo al cerrar
            showSimulatedNotification={showMessage}
          />
        )}
        {showProfile && user && ( // Solo renderizar ProfileView si hay un user autenticado
          <ProfileView
            user={user}
            db={db}
            appId={appId}
            storage={storage}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            editingProfile={editingProfile}
            setEditingProfile={setEditingProfile}
            name={name}
            setName={setName}
            location={location}
            setLocation={setLocation}
            photoURL={photoURL}
            setPhotoURL={setPhotoURL}
            role={role}
            setRole={setRole}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            uploadingPhoto={uploadingPhoto}
            setUploadingPhoto={setUploadingPhoto}
            showSimulatedNotification={showMessage}
          />
        )}
        {showReviewsDisplay && reviewsTargetUserId && (
          <ReviewsDisplay
            targetUserId={reviewsTargetUserId}
            onClose={() => setShowReviewsDisplay(false)}
            showSimulatedNotification={showMessage}
          />
        )}
        {showChat && chatRecipientId && (
          <ChatScreen
            recipientId={chatRecipientId}
            productName={chatProductName}
            onCloseChat={() => setShowChat(false)}
            showSimulatedNotification={showMessage}
          />
        )}
        {showReviewForm && reviewTargetSellerId && (
          <ReviewForm
            sellerId={reviewTargetSellerId}
            productId={reviewTargetProductId}
            onClose={() => setShowReviewForm(false)}
            showSimulatedNotification={showMessage}
          />
        )}
      </div>
    </FirebaseContext.Provider>
  );
}

export default App;