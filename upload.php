<?php
// Directorio donde guardar archivos
$uploadDir = __DIR__ . '/Recieved_Files/';

// Crear carpeta si no existe
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Comprobar si se ha subido algo
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $file = $_FILES['file'];
    $filename = basename($file['name']);
    $target = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $target)) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Archivo subido correctamente']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al mover el archivo']);
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Solicitud inválida']);
}
?>
