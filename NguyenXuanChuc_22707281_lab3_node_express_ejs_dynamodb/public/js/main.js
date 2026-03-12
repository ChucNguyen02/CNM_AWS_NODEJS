document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('image');
    
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                // Kiểm tra kích thước file (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.');
                    this.value = '';
                    return;
                }
                
                // Preview hình ảnh
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Tạo preview nếu chưa có
                    let preview = document.getElementById('image-preview');
                    if (!preview) {
                        preview = document.createElement('div');
                        preview.id = 'image-preview';
                        preview.style.marginTop = '10px';
                        imageInput.parentNode.appendChild(preview);
                    }
                    
                    preview.innerHTML = `
                        <p style="margin-bottom: 5px; color: #666;">Preview:</p>
                        <img src="${e.target.result}" style="max-width: 200px; border-radius: 5px; border: 2px solid #ddd;">
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Auto hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'opacity 0.5s';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    });
});