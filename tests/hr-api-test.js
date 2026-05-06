/**
 * HR API 集成测试脚本
 * 用于验证简化HR模块的API端点功能
 * 
 * 使用方法:
 * 1. 启动EasyERP服务器: npm start
 * 2. 在浏览器开发者工具中粘贴本脚本运行
 * 或使用 Node.js: node hr-api-test.js (需要修改请求方式)
 */

// ==================== 配置 ====================
const API_BASE_URL = 'http://localhost:3000/employees';
const TEST_RESULTS = [];

// ==================== 工具函数 ====================

/**
 * 发送API请求的通用函数
 */
async function apiRequest(method, endpoint, body = null) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'  // 包含cookie用于身份验证
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * 记录测试结果
 */
function recordTest(testName, passed, details) {
  TEST_RESULTS.push({
    name: testName,
    passed: passed,
    details: details,
    timestamp: new Date().toISOString()
  });
  
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${testName}`);
  if (details) console.log(`   → ${details}`);
}

/**
 * 生成测试报告
 */
function generateReport() {
  const total = TEST_RESULTS.length;
  const passed = TEST_RESULTS.filter(t => t.passed).length;
  const failed = total - passed;
  
  console.log('\n' + '='.repeat(60));
  console.log('HR API 测试报告');
  console.log('='.repeat(60));
  console.log(`总测试数: ${total}`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`成功率: ${((passed/total)*100).toFixed(2)}%`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    console.log('\n失败的测试:');
    TEST_RESULTS.filter(t => !t.passed).forEach(t => {
      console.log(`- ${t.name}: ${t.details}`);
    });
  }
}

// ==================== 测试场景 ====================

/**
 * 测试1: 招聘员工
 */
async function test1_HireEmployee() {
  const employeeData = {
    name: {
      first: '测试',
      last: '员工001'
    },
    baseSalary: 5000,
    workEmail: 'test001@company.com',
    workPhones: {
      mobile: '13800138000'
    }
  };
  
  const { status, data } = await apiRequest('POST', '/hire', employeeData);
  const passed = status === 201 && data._id && data.isEmployee && data.isActive;
  recordTest(
    '测试1: 招聘新员工',
    passed,
    passed ? `员工ID: ${data._id}, 薪资: ¥${data.baseSalary}` : `HTTP ${status}: ${JSON.stringify(data)}`
  );
  
  return passed ? data._id : null;
}

/**
 * 测试2: 获取在册员工总数
 */
async function test2_GetActiveCount() {
  const { status, data } = await apiRequest('GET', '/cost/active-count');
  const passed = status === 200 && typeof data.count === 'number' && data.count >= 0;
  recordTest(
    '测试2: 获取在册员工数',
    passed,
    passed ? `当前在册: ${data.count}人` : `HTTP ${status}: ${JSON.stringify(data)}`
  );
}

/**
 * 测试3: 获取月度成本
 */
async function test3_GetMonthlyCost() {
  const { status, data } = await apiRequest('GET', '/cost/monthly');
  const passed = status === 200 && typeof data.monthlyCost === 'number' && data.monthlyCost >= 0;
  recordTest(
    '测试3: 获取月度成本',
    passed,
    passed ? `月度成本: ¥${data.monthlyCost}, 年度: ¥${data.annualCost}` : `HTTP ${status}: ${JSON.stringify(data)}`
  );
}

/**
 * 测试4: 获取员工明细及成本
 */
async function test4_GetEmployeesWithCost() {
  const { status, data } = await apiRequest('GET', '/cost/with-employees');
  const passed = status === 200 && Array.isArray(data.employees) && typeof data.count === 'number';
  recordTest(
    '测试4: 获取员工明细',
    passed,
    passed ? `${data.count}名在册员工` : `HTTP ${status}: ${JSON.stringify(data)}`
  );
}

/**
 * 测试5: 裁员操作
 */
async function test5_FireEmployee(employeeId) {
  if (!employeeId) {
    recordTest('测试5: 裁员操作', false, '缺少员工ID（前置测试失败）');
    return;
  }
  
  const { status, data } = await apiRequest('PUT', `/${employeeId}/fire`);
  const passed = status === 200 && data._id === employeeId && !data.isEmployee && !data.isActive;
  recordTest(
    '测试5: 裁员操作',
    passed,
    passed ? `员工${employeeId}已离职` : `HTTP ${status}: ${JSON.stringify(data)}`
  );
}

/**
 * 测试6: 验证裁员后的成本变化
 */
async function test6_VerifyFireEffect() {
  const { status, data } = await apiRequest('GET', '/cost/monthly');
  const passed = status === 200;
  recordTest(
    '测试6: 验证裁员后成本更新',
    passed,
    passed ? `裁员后月度成本: ¥${data.monthlyCost}` : `HTTP ${status}`
  );
}

/**
 * 测试7: 批量招聘测试
 */
async function test7_BulkHire() {
  const testCount = 3;
  let successCount = 0;
  let totalCost = 0;
  
  for (let i = 0; i < testCount; i++) {
    const { status, data } = await apiRequest('POST', '/hire', {
      name: {
        first: '批量',
        last: `测试${i + 1}`
      },
      baseSalary: 4000 + (i * 500),
      workEmail: `bulk${i + 1}@company.com`
    });
    
    if (status === 201) {
      successCount++;
      totalCost += data.baseSalary;
    }
  }
  
  recordTest(
    '测试7: 批量招聘',
    successCount === testCount,
    `成功招聘${successCount}/${testCount}人, 总薪资¥${totalCost}`
  );
}

/**
 * 测试8: 无效请求处理
 */
async function test8_InvalidRequest() {
  // 缺少必需字段
  const { status } = await apiRequest('POST', '/hire', {
    name: { first: '测试' }
    // 缺少 baseSalary
  });
  
  const passed = status === 400;
  recordTest(
    '测试8: 错误处理（缺少字段）',
    passed,
    passed ? `正确返回400错误` : `返回${status}，应为400`
  );
}

/**
 * 测试9: 无效员工ID
 */
async function test9_InvalidEmployeeId() {
  const { status } = await apiRequest('PUT', '/invalid-id-12345/fire');
  const passed = status >= 400;  // 应返回400或404
  recordTest(
    '测试9: 错误处理（无效ID）',
    passed,
    passed ? `正确返回${status}错误` : `返回${status}`
  );
}

/**
 * 测试10: API响应格式验证
 */
async function test10_ResponseFormat() {
  const { status, data } = await apiRequest('GET', '/cost/monthly');
  const passed = status === 200 && 
                 data.hasOwnProperty('monthlyCost') && 
                 data.hasOwnProperty('annualCost') && 
                 data.hasOwnProperty('message');
  recordTest(
    '测试10: 响应格式验证',
    passed,
    passed ? '响应格式正确' : '缺少必要字段'
  );
}

// ==================== 主测试流程 ====================

async function runAllTests() {
  console.log('🧪 开始EasyERP HR API集成测试...\n');
  
  // 记录基本信息
  console.log(`📍 测试环境: ${API_BASE_URL}`);
  console.log(`⏰ 测试时间: ${new Date().toLocaleString()}\n`);
  console.log('开始执行测试...\n');
  
  // 执行测试序列
  const hiredEmployeeId = await test1_HireEmployee();
  await test2_GetActiveCount();
  await test3_GetMonthlyCost();
  await test4_GetEmployeesWithCost();
  await test5_FireEmployee(hiredEmployeeId);
  await test6_VerifyFireEffect();
  await test7_BulkHire();
  await test8_InvalidRequest();
  await test9_InvalidEmployeeId();
  await test10_ResponseFormat();
  
  // 生成报告
  generateReport();
  
  // 返回结果以便进一步处理
  return TEST_RESULTS;
}

// ==================== 执行 ====================

// 在浏览器控制台中运行
console.log('💡 提示: 这是一个HR API测试脚本');
console.log('📌 使用方法: 在浏览器开发者工具(F12)中打开本脚本');
console.log('▶️  运行: runAllTests()\n');

// 自动运行
runAllTests().catch(err => {
  console.error('❌ 测试执行出错:', err);
});
