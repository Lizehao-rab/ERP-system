var mongoose = require('mongoose');
var crypto = require('crypto');

mongoose.connect('mongodb://localhost/admin', { useNewUrlParser: true, useUnifiedTopology: true }, function(err) {
    if (err) {
        console.log('✗ 连接失败:', err.message);
        process.exit(1);
    }
    
    var userSchema = new mongoose.Schema({
        login: { type: String },
        pass: { type: String }
    }, { collection: 'User' });
    
    var User = mongoose.model('User', userSchema);
    
    // 对密码进行 SHA256 哈希
    var shaSum = crypto.createHash('sha256');
    shaSum.update('admin123');
    var hashedPassword = shaSum.digest('hex');
    
    // 更新用户密码
    User.updateOne({ login: 'admin' }, { $set: { pass: hashedPassword } }, function(err) {
        if (err) {
            console.log('✗ 更新失败:', err.message);
        } else {
            console.log('✓ 用户密码已更新');
            console.log('✓ 现在可以使用以下凭证登陆：');
            console.log('  用户名: admin');
            console.log('  密码: admin123');
        }
        mongoose.disconnect();
    });
});
